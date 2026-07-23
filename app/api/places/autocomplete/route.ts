import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { autocompleteAddress } from "@/lib/google-places";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query");
  if (!query || query.trim().length < 3) {
    return NextResponse.json({ predictions: [] });
  }

  try {
    const predictions = await autocompleteAddress(query.trim());
    return NextResponse.json({ predictions });
  } catch {
    return NextResponse.json(
      { error: "Address lookup failed" },
      { status: 502 }
    );
  }
}
