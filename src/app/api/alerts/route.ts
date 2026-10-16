import { NextResponse } from "next/server";
import { newId } from "../../../lib/labels";
import { serviceDb } from "../../../lib/supabase";

export async function GET() {
  return NextResponse.json({ searches: [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const area = String(body.area || "").trim().slice(0, 120);
  if (!email.includes("@") || email.length > 180) return NextResponse.json({ error: "Enter an email." }, { status: 400 });
  if (area.length < 2) return NextResponse.json({ error: "Enter an area." }, { status: 400 });
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: "Alerts are not connected." }, { status: 503 });
  const { error } = await db.from("alerts").insert({ id: newId("alt"), email, area });
  if (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("alerts") || message.includes("schema")) {
      return NextResponse.json({ error: "Alerts are not ready on this desk yet." }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not save the alert." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
