"use client";

import { useRouter } from "next/navigation";
import type { Home } from "@/lib/db/homes";

export function HomeSwitcher({
  homes,
  currentHomeId,
}: {
  homes: Home[];
  currentHomeId: string;
}) {
  const router = useRouter();

  if (homes.length <= 1) return null;

  return (
    <select
      value={currentHomeId}
      onChange={(e) => router.push(`/home/${e.target.value}`)}
      className="rounded border px-3 py-2 text-sm"
    >
      {homes.map((home) => (
        <option key={home.homeId} value={home.homeId}>
          {home.addressLine1}
        </option>
      ))}
    </select>
  );
}
