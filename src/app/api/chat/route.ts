import { NextResponse } from "next/server";
import { answer } from "../../../lib/assistant";
import { loadCatalog } from "../../../lib/catalog";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const catalog = await loadCatalog();
  return NextResponse.json({ reply: answer(String(body.message || ""), catalog.listings) });
}
