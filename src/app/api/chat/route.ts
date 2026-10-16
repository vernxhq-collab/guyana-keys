import { NextResponse } from "next/server";
import { answer } from "../../../lib/assistant";
import { loadCatalog, loadPublicAgents } from "../../../lib/catalog";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const [catalog, people] = await Promise.all([loadCatalog(), loadPublicAgents()]);
  return NextResponse.json({ reply: answer(String(body.message || ""), catalog.listings, people) });
}
