"use client";

import { useActionState, useState } from "react";
import type { HomeInput } from "@/lib/db/homes";

export type HomeFormState = { error?: string } | undefined;
export type HomeFormAction = (
  prevState: HomeFormState,
  formData: FormData
) => Promise<HomeFormState>;

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="number"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
        className="mt-1 w-full rounded border px-3 py-2"
      />
    </div>
  );
}

// Edit-only: for creating a new home, see AddHomeModal (address search +
// confirm creates the home). This form corrects/fills in data on an existing home.
export function HomeForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: HomeFormAction;
  initialValues: HomeInput;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [values, setValues] = useState<HomeInput>(initialValues);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state?.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="addressLine1" className="block text-sm font-medium">
          Address
        </label>
        <input
          id="addressLine1"
          name="addressLine1"
          type="text"
          required
          value={values.addressLine1}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, addressLine1: e.target.value }))
          }
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            value={values.city}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, city: e.target.value }))
            }
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium">
            State
          </label>
          <input
            id="state"
            name="state"
            type="text"
            required
            value={values.state}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, state: e.target.value }))
            }
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium">
            Postal code
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            required
            value={values.postalCode}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, postalCode: e.target.value }))
            }
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium">
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            required
            value={values.country}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, country: e.target.value }))
            }
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField
          id="squareFootage"
          label="Square footage"
          value={values.squareFootage}
          onChange={(v) => setValues((prev) => ({ ...prev, squareFootage: v }))}
        />
        <NumberField
          id="yearBuilt"
          label="Year built"
          value={values.yearBuilt}
          onChange={(v) => setValues((prev) => ({ ...prev, yearBuilt: v }))}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <NumberField
          id="totalBedrooms"
          label="Bedrooms"
          value={values.totalBedrooms}
          onChange={(v) => setValues((prev) => ({ ...prev, totalBedrooms: v }))}
        />
        <NumberField
          id="totalBathrooms"
          label="Bathrooms"
          value={values.totalBathrooms}
          onChange={(v) => setValues((prev) => ({ ...prev, totalBathrooms: v }))}
        />
        <NumberField
          id="acres"
          label="Lot size (acres)"
          value={values.acres}
          onChange={(v) => setValues((prev) => ({ ...prev, acres: v }))}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <NumberField
          id="totalAssessedValue"
          label="Assessed value"
          value={values.totalAssessedValue}
          onChange={(v) => setValues((prev) => ({ ...prev, totalAssessedValue: v }))}
        />
        <NumberField
          id="assessedYear"
          label="Assessed year"
          value={values.assessedYear}
          onChange={(v) => setValues((prev) => ({ ...prev, assessedYear: v }))}
        />
        <NumberField
          id="taxValue"
          label="Tax value"
          value={values.taxValue}
          onChange={(v) => setValues((prev) => ({ ...prev, taxValue: v }))}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <NumberField
          id="taxYear"
          label="Tax year"
          value={values.taxYear}
          onChange={(v) => setValues((prev) => ({ ...prev, taxYear: v }))}
        />
        <NumberField
          id="salePriceLastTransfer"
          label="Last sale price"
          value={values.salePriceLastTransfer}
          onChange={(v) =>
            setValues((prev) => ({ ...prev, salePriceLastTransfer: v }))
          }
        />
        <div>
          <label htmlFor="ownershipStartDate" className="block text-sm font-medium">
            Ownership start date
          </label>
          <input
            id="ownershipStartDate"
            name="ownershipStartDate"
            type="text"
            value={values.ownershipStartDate ?? ""}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, ownershipStartDate: e.target.value }))
            }
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
