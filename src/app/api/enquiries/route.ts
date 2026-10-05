import { NextResponse } from "next/server";
import { db } from "../../../lib/supabase";
export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name || !body.phone || !body.listingId) return NextResponse.json({ error: "Name, WhatsApp number, and property are required." }, { status: 400 });
  const client = db();
  if (!client) return NextResponse.json({ error: "Database is not connected." }, { status: 503 });
  const id = "enq-" + Math.random().toString(16).slice(2, 8);
  const { error } = await client.from("enquiries").insert({ id, listing_id: body.listingId, name: body.name, phone: body.phone, note: body.note || "", stage: "new" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id });
}
