import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getHome } from "@/lib/db/homes";
import { deleteHomeAction } from "../actions";

export default async function HomeDetailPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await auth();
  const home = await getHome(session!.user.id, homeId);

  if (!home) notFound();

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{home.addressLine1}</h1>
        <div className="flex gap-3">
          <Link href={`/homes/${home.homeId}/edit`} className="text-sm underline">
            Edit
          </Link>
          <form action={deleteHomeAction}>
            <input type="hidden" name="homeId" value={home.homeId} />
            <button type="submit" className="text-sm text-red-700 underline">
              Delete
            </button>
          </form>
        </div>
      </div>

      <p className="mt-1 text-gray-600">
        {home.city}, {home.state} {home.postalCode}, {home.country}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-gray-500">Square footage</dt>
          <dd>{home.squareFootage ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Year built</dt>
          <dd>{home.yearBuilt ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Bedrooms</dt>
          <dd>{home.totalBedrooms ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Bathrooms</dt>
          <dd>{home.totalBathrooms ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Lot size (acres)</dt>
          <dd>{home.acres ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Assessed value</dt>
          <dd>{home.totalAssessedValue ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Assessed year</dt>
          <dd>{home.assessedYear ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Tax value</dt>
          <dd>{home.taxValue ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Tax year</dt>
          <dd>{home.taxYear ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Last sale price</dt>
          <dd>{home.salePriceLastTransfer ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Ownership start date</dt>
          <dd>{home.ownershipStartDate ?? "—"}</dd>
        </div>
      </dl>

      <Link href="/homes" className="mt-6 inline-block text-sm underline">
        ← Back to homes
      </Link>
    </div>
  );
}
