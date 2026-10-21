import { NextResponse } from "next/server";
import { clientKey, tooMany } from "../../../lib/abuse";
import { draftListing, draftReply } from "../../../lib/draft";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (String(body.website || "").trim()) return NextResponse.json({ error: "Too many drafts. Wait and try again." }, { status: 400 });
  if (tooMany(`${clientKey(request)}:draft`, 20, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many drafts. Wait and try again." }, { status: 429 });
  if (body.kind === "reply") return NextResponse.json({ reply: draftReply(body.name || "there", body.listing || "this listing") });
  if (!body.notes) return NextResponse.json({ error: "Paste the agent's notes." }, { status: 400 });
  return NextResponse.json(draftListing(String(body.notes)));
}
