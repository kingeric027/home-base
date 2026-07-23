"use client";

import type { HomeInput } from "@/lib/db/homes";
import { useEffect, useState } from "react";

type Prediction = { placeId: string; description: string };

export function AddressAutocomplete({
  onSelect,
}: {
  onSelect: (details: HomeInput) => void;
}) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places/autocomplete?query=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setPredictions(data.predictions ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  async function handleSelect(p: Prediction) {
    setQuery(p.description);
    setOpen(false);
    setPredictions([]);
    const res = await fetch(
      `/api/places/details?placeId=${encodeURIComponent(p.placeId)}`
    );
    if (!res.ok) return;
    const details = await res.json();
    onSelect(details);
  }

  const visiblePredictions = query.trim().length < 3 ? [] : predictions;

  return (
    <div className="relative">
      <label htmlFor="address-search" className="block text-sm font-medium">
        Search for your address
      </label>
      <input
        id="address-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => visiblePredictions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Start typing an address..."
        autoComplete="off"
        className="mt-1 w-full rounded border px-3 py-2"
      />
      {loading && <p className="mt-1 text-xs text-gray-500">Searching...</p>}
      {open && visiblePredictions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded border bg-white shadow">
          {visiblePredictions.map((p) => (
            <li key={p.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(p)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                {p.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
