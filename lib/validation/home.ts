import { z } from "zod";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().optional()
);

export const homeSchema = z.object({
  addressLine1: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
  lat: optionalNumber,
  lng: optionalNumber,
  placeId: z.string().trim().optional(),
  squareFootage: optionalNumber,
  yearBuilt: optionalNumber,
  totalAssessedValue: optionalNumber,
  assessedYear: optionalNumber,
  taxValue: optionalNumber,
  taxYear: optionalNumber,
  acres: optionalNumber,
  totalBathrooms: optionalNumber,
  totalBedrooms: optionalNumber,
  salePriceLastTransfer: optionalNumber,
  ownershipStartDate: z.string().trim().optional(),
});
