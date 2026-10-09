import { NextResponse } from "next/server";
import { newId } from "../../../lib/labels";
import { serviceDb } from "../../../lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.phone) return NextResponse.json({ error: "Name and WhatsApp number are required." }, { status: 400 });
  const client = serviceDb();
  if (!client) return NextResponse.json({ error: "The enquiry could not be saved." }, { status: 503 });
  const id = newId("enq");
  const listingId = String(body.listingId || "");
  const { error } = await client.from("enquiries").insert({
    id,
    property_id: listingId && listingId !== "featured" ? listingId : null,
    name: String(body.name),
    phone: String(body.phone),
    note: String(body.note || ""),
    stage: "new",
  });
  if (error) return NextResponse.json({ error: "The enquiry could not be saved." }, { status: 500 });
  return NextResponse.json({ id });
}
