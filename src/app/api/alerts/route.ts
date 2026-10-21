import { NextResponse } from "next/server";
import { clientKey, tooMany } from "../../../lib/abuse";
import { siteUrl } from "../../../lib/contact";
import { newId } from "../../../lib/labels";
import { searchStopValid, sendEmail } from "../../../lib/notify";
import { serviceDb } from "../../../lib/supabase";

function token() {
  return newId("alt").replace(/[^a-z0-9]/gi, "") + Date.now().toString(36);
}

function missingAlertColumns(error: { message?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("confirmed") || message.includes("unsubscribed") || message.includes("token") || message.includes("schema cache");
}

function esc(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] || ch);
}

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title></head><body style="font-family:Georgia,serif;max-width:32rem;margin:3rem auto;padding:0 1rem;line-height:1.5"><h1>${esc(title)}</h1>${body}</body></html>`;
  return new NextResponse(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

function actionForm(action: string, fields: Record<string, string>, label: string, note: string) {
  const inputs = Object.entries(fields).map(([key, value]) => `<input type="hidden" name="${esc(key)}" value="${esc(value)}">`).join("");
  return `<p>${esc(note)}</p><form method="post" action="/api/alerts">${inputs}<input type="hidden" name="action" value="${esc(action)}"><button type="submit">${esc(label)}</button></form>`;
}

async function readBody(request: Request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return await request.json().catch(() => ({})) as Record<string, unknown>;
  const form = await request.formData().catch(() => null);
  const body: Record<string, string> = {};
  form?.forEach((value, key) => { body[key] = String(value); });
  return body;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const confirm = url.searchParams.get("token") || "";
  const stop = url.searchParams.get("stop") || "";
  const search = url.searchParams.get("search") || "";
  const sig = url.searchParams.get("sig") || "";
  if (search && sig) {
    return page("Unsubscribe", actionForm("unsearch", { search, sig }, "Unsubscribe", "This stops emails for one saved search. Nothing changes until you press the button."));
  }
  if (stop) {
    return page("Unsubscribe", actionForm("stop", { token: stop }, "Unsubscribe", "This stops one area alert. Nothing changes until you press the button."));
  }
  if (confirm) {
    return page("Confirm alert", actionForm("confirm", { token: confirm }, "Confirm", "Confirm this area alert. Nothing changes until you press the button."));
  }
  return page("Alert link", "<p>This link is not an alert.</p>", 404);
}

async function confirmAlert(secret: string) {
  const db = serviceDb();
  if (!db) return page("Alerts paused", "<p>Alerts are not connected. Nothing was changed.</p>", 503);
  const { data, error } = await db.from("alerts").update({ confirmed: true }).eq("token", secret).eq("unsubscribed", false).select("id");
  if (error && missingAlertColumns(error)) return page("Alerts paused", "<p>Alerts are paused until the database update. Nothing was changed.</p>", 503);
  if (error || !data?.length) return page("Could not confirm", "<p>This alert could not be confirmed. Nothing was changed.</p>", 400);
  return page("Alert confirmed", "<p>This alert is confirmed. We will email you when a home in that area is listed.</p>");
}

async function stopAlert(secret: string) {
  const db = serviceDb();
  if (!db) return page("Alerts paused", "<p>Alerts are not connected. Nothing was changed.</p>", 503);
  const { data, error } = await db.from("alerts").update({ unsubscribed: true, confirmed: false }).eq("token", secret).select("id");
  if (error && missingAlertColumns(error)) return page("Alerts paused", "<p>Alerts are paused until the database update. Nothing was changed.</p>", 503);
  if (error || !data?.length) return page("Could not unsubscribe", "<p>This alert link was not accepted. Nothing was changed.</p>", 400);
  return page("Unsubscribed", "<p>This area alert is stopped. We will not email it again.</p>");
}

async function unsearch(id: string, sig: string) {
  if (!searchStopValid(id, sig)) return page("Could not unsubscribe", "<p>This unsubscribe link was not accepted. Nothing was changed.</p>", 400);
  const db = serviceDb();
  if (!db) return page("Alerts paused", "<p>Saved searches are not connected. Nothing was changed.</p>", 503);
  const { error } = await db.from("saved_searches").delete().eq("id", id);
  if (error) return page("Could not unsubscribe", "<p>This saved search could not be removed. Nothing else was changed.</p>", 400);
  return page("Unsubscribed", "<p>This saved search will not email you again.</p>");
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const action = String(body.action || "");
  if (action === "confirm") return confirmAlert(String(body.token || ""));
  if (action === "stop") return stopAlert(String(body.token || ""));
  if (action === "unsearch") return unsearch(String(body.search || ""), String(body.sig || ""));

  if (String(body.website || "").trim()) return NextResponse.json({ error: "Could not save the alert." }, { status: 400 });
  if (tooMany(`${clientKey(request)}:alert`, 5, 60 * 60 * 1000)) return NextResponse.json({ error: "Too many alerts. Wait and try again." }, { status: 429 });
  const email = String(body.email || "").trim().toLowerCase();
  const area = String(body.area || "").trim().slice(0, 120);
  if (!email.includes("@") || email.length > 180) return NextResponse.json({ error: "Enter an email." }, { status: 400 });
  if (area.length < 2) return NextResponse.json({ error: "Enter an area." }, { status: 400 });
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: "Alerts are not connected. Nothing was saved." }, { status: 503 });
  const id = newId("alt");
  const secret = token();
  const rich = await db.from("alerts").insert({ id, email, area, confirmed: false, unsubscribed: false, token: secret });
  if (rich.error && missingAlertColumns(rich.error)) {
    const plain = await db.from("alerts").insert({ id, email, area });
    if (plain.error) return NextResponse.json({ error: "Alerts are paused. The alert was not saved." }, { status: 503 });
    return NextResponse.json({ ok: true, step: "saved" });
  }
  if (rich.error) return NextResponse.json({ error: "Could not save the alert." }, { status: 400 });
  const confirm = `${siteUrl()}/api/alerts?token=${secret}`;
  const stop = `${siteUrl()}/api/alerts?stop=${secret}`;
  const sent = await sendEmail(email, "Confirm your Guyana Keys alert", `Confirm this alert for ${area}:\n${confirm}\n\nUnsubscribe:\n${stop}`);
  if (sent !== "sent") {
    return NextResponse.json({
      ok: true,
      step: "paused",
      error: "Alert saved. Confirm email is not connected yet, so this alert stays paused until you confirm it.",
    });
  }
  return NextResponse.json({ ok: true, step: "confirm" });
}
