# HomeBase

A home-management web app: users log in, add up to 5 homes, and track Projects, Appliances, and Maintenance Tasks against each one. Address entry uses type-ahead search, and property data auto-fills from it. Image uploads are a planned future enhancement, not yet built.

## Tech Stack
- Next.js 16 (App Router), TypeScript (strict), React 19
- Tailwind CSS v4
- pnpm
- Hosted on Vercel
- Database: AWS DynamoDB (single table), connected via the Vercel Marketplace "AWS DynamoDB" integration
- Auth: Auth.js v5 (`next-auth@beta`), Credentials provider, JWT sessions — no third-party identity vendor
- Address search: Google Places API (Autocomplete + Place Details)

## Architecture Decisions

**Auth**: Auth.js v5 with a Credentials provider backed by our own DynamoDB users table (email + bcrypt hash). JWT session strategy — no adapter, no database sessions. Auth.js is used purely for its plumbing (JWT signing, secure cookies, CSRF, session helpers), not as a hosted identity service.

Auth config is split across two files because Next.js middleware runs on the Edge runtime, but bcrypt + DynamoDB calls need Node:
- `lib/auth.config.ts` — Edge-safe, no providers, used by `middleware.ts`
- `lib/auth.ts` — full config with the Credentials provider, only imported from Server Actions/Route Handlers/Server Components

**Database**: One DynamoDB table, raw AWS SDK v3 (`DynamoDBDocumentClient`) — no ORM/modeling library (ElectroDB/Dynamoose considered and explicitly rejected in favor of matching Vercel's own integration guide). Data access lives in hand-written per-entity modules under `lib/db/`.

Credentials come from Vercel's OIDC Federation via `@vercel/oidc-aws-credentials-provider` (`lib/db/client.ts`) — no static AWS keys anywhere. **Do not pass an explicit `audience` option** to `awsCredentialsProvider()` — Vercel's generic "Connect to AWS" docs show `audience: "sts.amazonaws.com"`, but that's for a DIY OIDC setup. The Marketplace DynamoDB integration provisions its own IAM role/trust policy for the default audience, and passing that override causes `InvalidIdentityTokenException` (confirmed by hand during Phase 0 setup — omitting `audience` entirely fixed it).

Schema cheat-sheet (PK / SK):

| Entity | PK | SK |
|---|---|---|
| Email lock | `EMAIL#<email>` | `EMAIL#<email>` |
| User profile | `USER#<userId>` | `PROFILE` |
| Home | `USER#<userId>` | `HOME#<homeId>` |
| Project | `HOME#<homeId>` | `PROJECT#<projectId>` |
| Appliance | `HOME#<homeId>` | `APPLIANCE#<applianceId>` |
| Maintenance Task | `HOME#<homeId>` | `TASK#<taskId>` (+ sparse `GSI1` when it has an open due date) |
| Image *(future)* | `HOME#<homeId>` | `IMAGE#<parentType>#<parentId>#<imageId>` |

`GSI1` (`GSI1PK`/`GSI1SK`) exists only to query "maintenance tasks due soon across all of a user's homes" — sparse, only Maintenance Task items carry it.

**Address search + property data**: Google Places Autocomplete + Place Details are called from a server-side proxy route (`app/api/places/autocomplete`, `app/api/places/details`) to keep `GOOGLE_MAPS_API_KEY` off the client. (Originally planned to use Radar.io, but Radar's signup required a sales demo — switched to Google Places, which is self-serve with a Google Cloud billing account.) `app/api/places/details` also calls Realie (`lib/realie.ts`, `REALIE_API_KEY`) for public property records (assessed value, tax value, bedrooms/bathrooms, acreage, last sale price/date, year built, living area) and merges both sources into one flat response — a best-effort call, wrapped so a Realie failure never blocks the address lookup itself.

**Creating a home has no manual-entry form and no dedicated route** — it's a modal (`components/add-home-modal.tsx`), not a `/homes/new` page (that page was removed). The user searches for and selects an address (`AddressAutocomplete`) inside the modal, the resolved Google + Realie payload is held in local state and previewed as a formatted address, and only clicking "Add" sends it to `createHomeFromAddressAction`, which creates the home and redirects to its detail page. `HomeForm`/`components/home-form.tsx` is edit-only, for correcting/filling in fields on an already-created home.

**One shared `HomeInput`/`Home` type** (`lib/db/homes.ts`) is used across the `/api/places/details` response, the edit form, and the DB layer — `HomeInput` is the raw data fields, `Home` extends it with the system-managed `homeId`/`userId`/`createdAt`/`updatedAt` (always present once persisted, absent before). Avoid re-introducing a parallel duplicate type in a route or component — extend/reuse this one.

There's no standalone `price` field — removed deliberately since it overlapped confusingly with Realie's `salePriceLastTransfer` (actual last sale, public record) and `totalAssessedValue` (tax assessor's valuation), and unlike every other field it had no auto-fill source, so it always showed up empty right after creating a home.

**`/home/{homeId}` is the single primary hub — not a set of routes.** Dashboard/Maintenance/Projects/Appliances are `useState` tabs inside one client component (`components/home-tabs-panel.tsx`), rendered from one page (`app/(app)/home/[homeId]/page.tsx`) — there is no `/home/[homeId]/maintenance` etc. route. A home-switcher dropdown (`components/home-switcher.tsx`, hidden when the user has only one home) sits above the tabs and navigates between homes via `router.push`. The Dashboard tab *is* the edit form (`HomeForm`) pre-filled with the home's current values — there's no separate read-only detail view anymore. Maintenance/Projects/Appliances tabs are static placeholders until Phases 3–5 build them out.

**Every auth entry point redirects to a home, never a generic dashboard.** A brand-new registration always has zero homes, so `registerAction` goes to `/homes` (its empty state has the "Add a home" button that opens the modal). Login calls `listHomes()`: zero → `/homes`, otherwise → `/home/{first homeId}`. Deleting a home does the same re-check: homes remain → redirect to one of them; none left → `/homes`. There is no `/dashboard` route anymore (deleted). Getting `userId` right after `signIn()` requires reading it from `verifyCredentials()`'s own return value (or `createUser()`'s, at registration) — **not** by calling `auth()` again in the same action right after `signIn()`, since `auth()` reads the *incoming* request's cookies, which don't yet include the one `signIn()` just queued for the outgoing response.

**`/homes` (the list-all-homes page) is the landing page whenever there's no specific home to route to yet** (zero homes, or the moment right after register/login/delete) — it's not vestigial, keep it working. It's also currently the only place `AddHomeModal` is triggered from, since the home-switcher dropdown doesn't have its own "add" option. `/homes/[homeId]` and `/homes/[homeId]/edit` (the pre-tabs detail/edit pages, superseded by `/home/[homeId]`) are still present, unused and un-linked — left alone for now rather than deleted, cleanup deferred.

## Invariants to Preserve

- **Ownership check on every mutation**: there's no ORM enforcing relations, so any Server Action writing a Project/Appliance/Task must re-verify the `homeId` it receives actually belongs to the logged-in user (`GetItem(PK=USER#<sessionUserId>, SK=HOME#<homeId>)`) before writing. Skipping this is an IDOR vulnerability.
- **Home limit (5 per user) uses a transaction, not a read-then-write counter check** — `TransactWriteItems` conditionally increments `homeCount` on the user profile atomically with the home `Put`, so concurrent requests can't both slip past the limit.
- **Recurring maintenance tasks** recompute `nextDueDate` from the *completion* date, not the original due date, to avoid backlog pile-up. Completing a one-time task removes its `GSI1PK`/`GSI1SK` so it drops out of the due-soon index.

## Commands
- `pnpm dev` — start dev server
- `pnpm build` / `pnpm start` — production build/run
- `pnpm lint` — lint

**Local `VERCEL_OIDC_TOKEN` expires after ~12 hours.** If DynamoDB calls that worked before suddenly fail locally with `VercelOidcTokenError` ("project.json not found..."), that's the local dev OIDC token expiring — not a code regression. Fix: `vercel env pull .env.local`. This is expected/normal, not a bug — re-pull at the start of each dev session to avoid mid-session auth failures. (Standalone scripts run via `tsx` also need the token explicitly loaded: `npx tsx --env-file=.env.local <script>`, since only Next.js auto-loads `.env.local`.)

## Not Yet Built
- Image uploads (attachable to Home/Project/Maintenance Task) — schema reserves space for this (`IMAGE#` SK convention) but storage backend (Vercel Blob vs S3) isn't decided yet.
