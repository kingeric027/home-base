import Link from "next/link";
import { auth } from "@/lib/auth";
import { listHomes, MAX_HOMES_PER_USER } from "@/lib/db/homes";
import { AddHomeModal } from "@/components/add-home-modal";

export default async function HomesPage() {
  const session = await auth();
  const homes = await listHomes(session!.user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your homes</h1>
        {homes.length < MAX_HOMES_PER_USER && <AddHomeModal />}
      </div>

      <p className="mt-1 text-sm text-gray-500">
        {homes.length} / {MAX_HOMES_PER_USER} homes
      </p>

      {homes.length === 0 ? (
        <p className="mt-6 text-gray-600">
          You haven&apos;t added any homes yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {homes.map((home) => (
            <li key={home.homeId}>
              <Link
                href={`/home/${home.homeId}`}
                className="block rounded border p-4 hover:bg-gray-50"
              >
                <p className="font-medium">{home.addressLine1}</p>
                <p className="text-sm text-gray-600">
                  {home.city}, {home.state} {home.postalCode}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
