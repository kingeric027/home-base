"use client";

import { useState, useTransition } from "react";
import { AddressAutocomplete } from "./address-autocomplete";
import { createHomeFromAddressAction } from "@/app/(app)/homes/actions";
import type { HomeInput } from "@/lib/db/homes";

export function AddHomeModal() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<HomeInput | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setSelected(null);
    setError(undefined);
  }

  function handleAdd() {
    if (!selected) return;
    setError(undefined);
    startTransition(async () => {
      const result = await createHomeFromAddressAction(selected);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Add a home
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">Add a home</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="text-gray-500"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Enter your address to add your home.
            </p>

            <div className="mt-4">
              <AddressAutocomplete onSelect={setSelected} />
            </div>

            {selected && (
              <p className="mt-3 rounded bg-gray-50 px-3 py-2 text-sm">
                {selected.addressLine1}, {selected.city}, {selected.state}{" "}
                {selected.postalCode}, {selected.country}
              </p>
            )}

            {error && (
              <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selected || pending}
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {pending ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
