import { NextResponse } from "next/server";
import { clientKey, tooMany } from "../../../lib/abuse";
import { answer } from "../../../lib/assistant";
import { loadCatalog, loadPublicAgents } from "../../../lib/catalog";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (String(body.website || "").trim()) return NextResponse.json({ error: "Too many questions. Wait and try again." }, { status: 400 });
  if (tooMany(`${clientKey(request)}:chat`, 20, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many questions. Wait and try again." }, { status: 429 });
  const [catalog, people] = await Promise.all([loadCatalog(), loadPublicAgents()]);
  return NextResponse.json({ reply: answer(String(body.message || ""), catalog.listings, people) });
}
