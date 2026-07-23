"use client";

import { useState } from "react";
import { HomeForm, type HomeFormAction } from "./home-form";
import type { Home } from "@/lib/db/homes";

type Tab = "dashboard" | "maintenance" | "projects" | "appliances";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "maintenance", label: "Maintenance" },
  { key: "projects", label: "Projects" },
  { key: "appliances", label: "Appliances" },
];

export function HomeTabsPanel({
  home,
  updateAction,
  deleteAction,
}: {
  home: Home;
  updateAction: HomeFormAction;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div>
      <nav className="flex gap-6 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 pb-2 text-sm ${
              tab === t.key
                ? "border-black font-medium"
                : "border-transparent text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "dashboard" && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold">{home.addressLine1}</h1>
                <p className="text-sm text-gray-600">
                  {home.city}, {home.state} {home.postalCode}
                </p>
              </div>
              <form action={deleteAction}>
                <input type="hidden" name="homeId" value={home.homeId} />
                <button
                  type="submit"
                  className="text-sm text-red-700 underline"
                >
                  Delete home
                </button>
              </form>
            </div>

            <div className="mt-6">
              <HomeForm
                action={updateAction}
                initialValues={home}
                submitLabel="Save changes"
              />
            </div>
          </div>
        )}

        {tab === "maintenance" && (
          <div>
            <h2 className="text-lg font-medium">Maintenance</h2>
            <p className="mt-2 text-sm text-gray-600">
              Not built yet — coming in a future phase.
            </p>
          </div>
        )}

        {tab === "projects" && (
          <div>
            <h2 className="text-lg font-medium">Projects</h2>
            <p className="mt-2 text-sm text-gray-600">
              Not built yet — coming in a future phase.
            </p>
          </div>
        )}

        {tab === "appliances" && (
          <div>
            <h2 className="text-lg font-medium">Appliances</h2>
            <p className="mt-2 text-sm text-gray-600">
              Not built yet — coming in a future phase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
