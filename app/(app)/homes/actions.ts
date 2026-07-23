"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createHome,
  updateHome,
  deleteHome,
  listHomes,
  HomeLimitReachedError,
  HomeNotFoundError,
  type HomeInput,
} from "@/lib/db/homes";
import { homeSchema } from "@/lib/validation/home";
import type { HomeFormState } from "@/components/home-form";

function parseHomeForm(formData: FormData) {
  return homeSchema.safeParse({
    addressLine1: formData.get("addressLine1"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    placeId: formData.get("placeId"),
    squareFootage: formData.get("squareFootage"),
    yearBuilt: formData.get("yearBuilt"),
    totalAssessedValue: formData.get("totalAssessedValue"),
    assessedYear: formData.get("assessedYear"),
    taxValue: formData.get("taxValue"),
    taxYear: formData.get("taxYear"),
    acres: formData.get("acres"),
    totalBathrooms: formData.get("totalBathrooms"),
    totalBedrooms: formData.get("totalBedrooms"),
    salePriceLastTransfer: formData.get("salePriceLastTransfer"),
    ownershipStartDate: formData.get("ownershipStartDate"),
  });
}

export async function createHomeFromAddressAction(
  details: HomeInput
): Promise<HomeFormState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = homeSchema.safeParse(details);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let home;
  try {
    home = await createHome(session.user.id, parsed.data);
  } catch (err) {
    if (err instanceof HomeLimitReachedError) {
      return { error: err.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  redirect(`/home/${home.homeId}`);
}

export async function updateHomeAction(
  homeId: string,
  _prevState: HomeFormState,
  formData: FormData
): Promise<HomeFormState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = parseHomeForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await updateHome(session.user.id, homeId, parsed.data);
  } catch (err) {
    if (err instanceof HomeNotFoundError) {
      return { error: "Home not found" };
    }
    return { error: "Something went wrong. Please try again." };
  }

  redirect(`/home/${homeId}`);
}

export async function deleteHomeAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const homeId = formData.get("homeId");
  if (typeof homeId !== "string") redirect("/homes");

  await deleteHome(session.user.id, homeId);

  const remaining = await listHomes(session.user.id);
  if (remaining.length > 0) {
    redirect(`/home/${remaining[0].homeId}`);
  }
  redirect("/homes");
}
