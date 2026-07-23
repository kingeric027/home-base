import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAddressDetails } from "@/lib/google-places";
import { getRealieDetails, RealEstateDetails } from "@/lib/realie";
import type { HomeInput } from "@/lib/db/homes";

function toHomeInput(
  addressDetails: Awaited<ReturnType<typeof getAddressDetails>>,
  realEstateDetails: RealEstateDetails | undefined
): HomeInput {
  return {
    ...addressDetails,
    yearBuilt: realEstateDetails?.yearBuilt,
    squareFootage: realEstateDetails?.livingArea,
    totalAssessedValue: realEstateDetails?.totalAssessedValue,
    assessedYear: realEstateDetails?.assessedYear,
    taxValue: realEstateDetails?.taxValue,
    taxYear: realEstateDetails?.taxYear,
    acres: realEstateDetails?.acres,
    totalBathrooms: realEstateDetails?.totalBathrooms,
    totalBedrooms: realEstateDetails?.totalBedrooms,
    salePriceLastTransfer: realEstateDetails?.salePriceLastTransfer,
    ownershipStartDate: realEstateDetails?.ownershipStartDate,
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  let addressDetails;
  try {
    addressDetails = await getAddressDetails(placeId);
  } catch {
    return NextResponse.json(
      { error: "Address lookup failed" },
      { status: 502 }
    );
  }

  let realEstateDetails: RealEstateDetails | undefined = undefined;
  try {
    realEstateDetails = await getRealieDetails(
      addressDetails.state,
      addressDetails.addressLine1
    );
  } catch {
    console.log("error fetching real estate details");
  }

  return NextResponse.json(toHomeInput(addressDetails, realEstateDetails));
}
