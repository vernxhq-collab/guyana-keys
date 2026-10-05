import { NextResponse } from "next/server";
import { draftListing, draftReply } from "../../../lib/draft";
export async function POST(request: Request) {
  const body = await request.json();
  if (body.kind === "reply") return NextResponse.json({ reply: draftReply(body.name || "there", body.listing || "this listing") });
  if (!body.notes) return NextResponse.json({ error: "Paste the agent's notes." }, { status: 400 });
  return NextResponse.json(draftListing(String(body.notes)));
}
