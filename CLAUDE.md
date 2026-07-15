# HomeBase

A home-management web app: users log in, add up to 5 homes, and track Projects, Appliances, and Maintenance Tasks against each one. Address entry uses type-ahead search. Image uploads are a planned future enhancement, not yet built.

## Tech Stack
- Next.js 16 (App Router), TypeScript (strict), React 19
- Tailwind CSS v4
- pnpm
- Hosted on Vercel
- Database: AWS DynamoDB (single table), connected via the Vercel Marketplace "AWS DynamoDB" integration
- Auth: Auth.js v5 (`next-auth@beta`), Credentials provider, JWT sessions — no third-party identity vendor
- Address search: Radar.io

## Architecture Decisions

**Auth**: Auth.js v5 with a Credentials provider backed by our own DynamoDB users table (email + bcrypt hash). JWT session strategy — no adapter, no database sessions. Auth.js is used purely for its plumbing (JWT signing, secure cookies, CSRF, session helpers), not as a hosted identity service.

Auth config is split across two files because Next.js middleware runs on the Edge runtime, but bcrypt + DynamoDB calls need Node:
- `lib/auth.config.ts` — Edge-safe, no providers, used by `middleware.ts`
- `lib/auth.ts` — full config with the Credentials provider, only imported from Server Actions/Route Handlers/Server Components

**Database**: One DynamoDB table, raw AWS SDK v3 (`DynamoDBDocumentClient`) — no ORM/modeling library (ElectroDB/Dynamoose considered and explicitly rejected in favor of matching Vercel's own integration guide). Data access lives in hand-written per-entity modules under `lib/db/`.

Credentials come from Vercel's OIDC Federation via `@vercel/oidc-aws-credentials-provider` (`lib/db/client.ts`) — no static AWS keys anywhere.

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

**Address search**: Radar.io autocomplete is called from a server-side proxy route (`app/api/radar/autocomplete`) to keep the secret key off the client.

## Invariants to Preserve

- **Ownership check on every mutation**: there's no ORM enforcing relations, so any Server Action writing a Project/Appliance/Task must re-verify the `homeId` it receives actually belongs to the logged-in user (`GetItem(PK=USER#<sessionUserId>, SK=HOME#<homeId>)`) before writing. Skipping this is an IDOR vulnerability.
- **Home limit (5 per user) uses a transaction, not a read-then-write counter check** — `TransactWriteItems` conditionally increments `homeCount` on the user profile atomically with the home `Put`, so concurrent requests can't both slip past the limit.
- **Recurring maintenance tasks** recompute `nextDueDate` from the *completion* date, not the original due date, to avoid backlog pile-up. Completing a one-time task removes its `GSI1PK`/`GSI1SK` so it drops out of the due-soon index.

## Commands
- `pnpm dev` — start dev server
- `pnpm build` / `pnpm start` — production build/run
- `pnpm lint` — lint

## Not Yet Built
- Image uploads (attachable to Home/Project/Maintenance Task) — schema reserves space for this (`IMAGE#` SK convention) but storage backend (Vercel Blob vs S3) isn't decided yet.
- Auto-fetching property details (sq ft, year built, price) from a public API — manual entry only for now.
