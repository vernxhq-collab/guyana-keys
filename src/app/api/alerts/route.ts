import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addSearch, searchesFor, userFromToken } from "../../../lib/store";

export async function GET() {
  const user = userFromToken((await cookies()).get("gk_session")?.value);
  if (!user) return NextResponse.json({ searches: [] });
  return NextResponse.json({ searches: searchesFor(user.id) });
}

export async function POST(request: Request) {
  const user = userFromToken((await cookies()).get("gk_session")?.value);
  if (!user) return NextResponse.json({ error: "Sign in to save a search." }, { status: 401 });
  const body = await request.json();
  const searches = addSearch({
    userId: user.id,
    area: body.area || "",
    purpose: body.purpose || "Sale",
    minBeds: Number(body.minBeds || 0),
    maxPrice: body.maxPrice ? Number(body.maxPrice) : null,
  });
  return NextResponse.json({ searches });
}
