import { NextResponse } from "next/server";
import { clientKey, tooMany } from "../../../lib/abuse";
import { siteUrl } from "../../../lib/contact";
import { newId } from "../../../lib/labels";
import { sendEmail } from "../../../lib/notify";
import { serviceDb } from "../../../lib/supabase";

function token() {
  return newId("alt").replace(/[^a-z0-9]/gi, "") + Date.now().toString(36);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stop = url.searchParams.get("stop") || "";
  const confirm = url.searchParams.get("token") || "";
  const db = serviceDb();
  if (!db || (!stop && !confirm)) return NextResponse.json({ ok: false }, { status: 400 });
  if (stop) {
    await db.from("alerts").update({ unsubscribed: true, confirmed: false }).eq("token", stop);
    return NextResponse.json({ ok: true, unsubscribed: true });
  }
  const { error } = await db.from("alerts").update({ confirmed: true }).eq("token", confirm).eq("unsubscribed", false);
  if (error) return NextResponse.json({ error: "This alert could not be confirmed." }, { status: 400 });
  return NextResponse.json({ ok: true, confirmed: true });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (String(body.website || "").trim()) return NextResponse.json({ error: "Could not save the alert." }, { status: 400 });
  if (tooMany(`${clientKey(request)}:alert`, 5, 60 * 60 * 1000)) return NextResponse.json({ error: "Too many alerts. Wait and try again." }, { status: 429 });
  const email = String(body.email || "").trim().toLowerCase();
  const area = String(body.area || "").trim().slice(0, 120);
  if (!email.includes("@") || email.length > 180) return NextResponse.json({ error: "Enter an email." }, { status: 400 });
  if (area.length < 2) return NextResponse.json({ error: "Enter an area." }, { status: 400 });
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: "Alerts are not connected." }, { status: 503 });
  const secret = token();
  const { error } = await db.from("alerts").insert({ id: newId("alt"), email, area, confirmed: false, unsubscribed: false, token: secret });
  if (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("confirmed") || message.includes("token") || message.includes("alerts") || message.includes("schema")) {
      return NextResponse.json({ error: "Alerts need a database update before they can send." }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not save the alert." }, { status: 400 });
  }
  const confirm = `${siteUrl()}/api/alerts?token=${secret}`;
  const stop = `${siteUrl()}/api/alerts?stop=${secret}`;
  const sent = await sendEmail(email, "Confirm your Guyana Keys alert", `Confirm this alert for ${area}:\n${confirm}\n\nUnsubscribe:\n${stop}`);
  if (sent !== "sent") {
    await db.from("alerts").delete().eq("token", secret);
    return NextResponse.json({ error: "Confirm email is not connected yet." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, step: "confirm" });
}
