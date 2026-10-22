import { NextResponse } from "next/server";
import { clientKey, tooMany } from "../../../lib/abuse";
import { newId } from "../../../lib/labels";
import { serviceDb } from "../../../lib/supabase";

export async function POST(request: Request) {
  if (tooMany(`apply:${clientKey(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many applications from this network. Try again later." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  if (String(body.website || "").trim()) return NextResponse.json({ ok: true });
  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);
  const phone = String(body.phone || "").trim().slice(0, 40);
  const company = String(body.company || "").trim().slice(0, 160);
  const areas = String(body.areas || "").trim().slice(0, 240);
  const message = String(body.message || "").trim().slice(0, 2000);
  if (name.length < 2 || !email.includes("@") || phone.length < 6) {
    return NextResponse.json({ error: "Enter a name, email, and phone." }, { status: 400 });
  }
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: "Applications are not open yet." }, { status: 503 });
  const { error } = await db.from("agent_applications").insert({
    id: newId("app"),
    name,
    email,
    phone,
    company,
    areas,
    message,
    status: "submitted",
  });
  if (error) {
    const missing = String(error.message || "").toLowerCase().includes("agent_applications");
    return NextResponse.json({ error: missing ? "Applications are not open yet." : "The application could not be saved." }, { status: missing ? 503 : 400 });
  }
  return NextResponse.json({ ok: true });
}
