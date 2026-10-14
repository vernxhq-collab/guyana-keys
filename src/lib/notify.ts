import { whenLabel } from "./assist";
import { deskFrom } from "./contact";
import { digits, newId } from "./labels";
import { serviceDb } from "./supabase";

export type MatchListing = {
  id: string;
  title: string;
  purpose: string;
  area: string;
  beds: number;
  priceGyd: number;
};

type SendStatus = "sent" | "skipped" | "failed";

export function matchSearch(
  search: { purpose?: string; area?: string; beds?: number; maxPrice?: number },
  listing: MatchListing,
) {
  const purpose = (search.purpose || "").trim();
  if (purpose && purpose !== listing.purpose) return false;
  const area = (search.area || "").trim().toLowerCase();
  if (area && area !== listing.area.trim().toLowerCase()) return false;
  const beds = Number(search.beds || 0);
  if (beds > 0 && listing.beds < beds) return false;
  const maxPrice = Number(search.maxPrice || 0);
  if (maxPrice > 0 && listing.priceGyd > maxPrice) return false;
  return true;
}

export function e164(phone: string) {
  const raw = digits(phone);
  if (raw.length < 7) return "";
  return `+${raw}`;
}

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://guyana-keys.vercel.app").replace(/\/$/, "");
}

function missingRelation(error: { message?: string } | null, name: string) {
  return String(error?.message || "").toLowerCase().includes(name);
}

function alreadyStored(error: { message?: string; code?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "23505" || message.includes("duplicate") || message.includes("notices_dedupe");
}

export async function sendWhatsApp(phone: string, text: string): Promise<SendStatus> {
  const key = process.env.WASENDER_API_KEY || "";
  const to = e164(phone);
  if (!key || !to || !text.trim()) return "skipped";
  try {
    const res = await fetch("https://www.wasenderapi.com/api/send-message", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to, text }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export async function sendEmail(to: string, subject: string, text: string): Promise<SendStatus> {
  const key = process.env.RESEND_API_KEY || "";
  const from = process.env.ALERT_FROM_EMAIL || deskFrom;
  if (!key || !from || !to.includes("@") || !subject.trim() || !text.trim()) return "skipped";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

async function recordNotice(row: {
  userId?: string | null;
  email?: string;
  phone?: string;
  channel: "email" | "whatsapp";
  kind: "search" | "alert" | "enquiry" | "reply" | "viewing";
  propertyId?: string;
  body: string;
  status: SendStatus;
  dedupe: string;
}) {
  const db = serviceDb();
  if (!db || !row.dedupe) return false;
  const { error } = await db.from("notices").insert({
    id: newId("ntc"),
    user_id: row.userId || null,
    email: (row.email || "").trim().toLowerCase().slice(0, 180),
    phone: (row.phone || "").slice(0, 40),
    channel: row.channel,
    kind: row.kind,
    property_id: row.propertyId || "",
    body: row.body.slice(0, 2000),
    status: row.status,
    dedupe: row.dedupe.slice(0, 240),
  });
  if (!error || alreadyStored(error)) return true;
  return !missingRelation(error, "notices");
}

function listingLine(listing: MatchListing) {
  const price = new Intl.NumberFormat("en-GY").format(listing.priceGyd || 0);
  const link = `${siteOrigin()}/listings/${listing.id}`;
  return `${listing.title} in ${listing.area} is live (${listing.purpose}, GYD ${price}). ${link}`;
}

export async function notifyMatches(listing: MatchListing) {
  try {
    const db = serviceDb();
    if (!db || !listing.id) return;
    const prior = await db.from("notices").select("dedupe").eq("property_id", listing.id);
    if (prior.error) return;
    const seen = new Set((prior.data || []).map((row) => String(row.dedupe || "")));
    const searches = await db.from("saved_searches").select("id,user_id,purpose,area,beds,max_price");
    const alerts = await db.from("alerts").select("id,email,area");
    const searchRows = searches.data || [];
    const userIds = [...new Set(searchRows.map((row) => String(row.user_id || "")).filter(Boolean))];
    const people = new Map<string, { email: string; phone: string }>();
    if (userIds.length) {
      const profiles = await db.from("profiles").select("id,email,phone").in("id", userIds);
      for (const person of profiles.data || []) {
        people.set(String(person.id), { email: String(person.email || ""), phone: String(person.phone || "") });
      }
    }
    const line = listingLine(listing);
    const subject = `A home matches: ${listing.title}`;
    for (const search of searchRows) {
      if (!matchSearch({
        purpose: String(search.purpose || ""),
        area: String(search.area || ""),
        beds: Number(search.beds || 0),
        maxPrice: Number(search.max_price || 0),
      }, listing)) continue;
      const userId = String(search.user_id || "");
      const person = people.get(userId) || { email: "", phone: "" };
      const base = `search:${search.id}:${listing.id}`;
      if (person.email && !seen.has(`${base}:email`)) {
        const status = await sendEmail(person.email, subject, line);
        await recordNotice({ userId, email: person.email, channel: "email", kind: "search", propertyId: listing.id, body: line, status, dedupe: `${base}:email` });
      }
      if (person.phone && !seen.has(`${base}:whatsapp`)) {
        const status = await sendWhatsApp(person.phone, line);
        await recordNotice({ userId, phone: person.phone, channel: "whatsapp", kind: "search", propertyId: listing.id, body: line, status, dedupe: `${base}:whatsapp` });
      }
      if (!person.email && !person.phone && !seen.has(base)) {
        await recordNotice({ userId, channel: "email", kind: "search", propertyId: listing.id, body: line, status: "skipped", dedupe: base });
      }
    }
    if (alerts.error) return;
    for (const alert of alerts.data || []) {
      const area = String(alert.area || "");
      if (!matchSearch({ area }, listing)) continue;
      const email = String(alert.email || "").trim();
      const dedupe = `alert:${alert.id}:${listing.id}:email`;
      if (!email || seen.has(dedupe)) continue;
      const status = await sendEmail(email, subject, line);
      await recordNotice({ email, channel: "email", kind: "alert", propertyId: listing.id, body: line, status, dedupe });
    }
  } catch {
    // A notice problem must not block the listing.
  }
}

export async function leadIntent(buyerId: string, propertyId: string, area: string) {
  const db = serviceDb();
  if (!db || !buyerId) return "";
  const notes: string[] = [];
  try {
    const saved = await db.from("saved_homes").select("property_id").eq("user_id", buyerId).eq("property_id", propertyId).maybeSingle();
    if (saved.data) notes.push("Saved this home.");
    const searches = await db.from("saved_searches").select("area").eq("user_id", buyerId);
    const wanted = area.trim().toLowerCase();
    if (wanted && (searches.data || []).some((row) => String(row.area || "").trim().toLowerCase() === wanted)) notes.push("Has a saved search for this area.");
    const profile = await db.from("profiles").select("email").eq("id", buyerId).maybeSingle();
    const email = String(profile.data?.email || "").trim().toLowerCase();
    if (email && wanted) {
      const alerts = await db.from("alerts").select("area,email").eq("email", email);
      if ((alerts.data || []).some((row) => String(row.area || "").trim().toLowerCase() === wanted)) notes.push("Has an alert for this area.");
    }
  } catch {
    return notes.join(" ");
  }
  return notes.join(" ");
}

export function guyanaKeysLeadMessage(input: {
  title: string;
  buyerName: string;
  phone: string;
  note: string;
  intent?: string;
  propertyId: string;
}) {
  const lines = [
    "🔑 Guyana Keys Lead",
    "",
    `Property: ${input.title || "a home"}`,
    `Buyer: ${input.buyerName || "A buyer"}`,
    `Phone: ${input.phone || "No phone"}`,
    `Message: ${input.note.trim() || "No message"}`,
  ];
  if (input.intent?.trim()) lines.push(input.intent.trim());
  lines.push("", "Source: Guyana Keys", `View listing: ${siteOrigin()}/listings/${input.propertyId}`);
  return lines.join("\n");
}

export async function notifyAgentEnquiry(input: {
  agentId: string | null;
  buyerName: string;
  phone: string;
  title: string;
  note: string;
  intent?: string;
  propertyId: string;
  enquiryId: string;
}) {
  try {
    if (!input.agentId || !input.enquiryId) return;
    const db = serviceDb();
    if (!db) return;
    const agent = await db.from("profiles").select("phone,email").eq("id", input.agentId).maybeSingle();
    const phone = String(agent.data?.phone || "");
    const email = String(agent.data?.email || "");
    const text = guyanaKeysLeadMessage(input);
    const whatsapp = await sendWhatsApp(phone, text);
    await recordNotice({
      phone,
      channel: "whatsapp",
      kind: "enquiry",
      propertyId: input.propertyId,
      body: text,
      status: whatsapp,
      dedupe: `enquiry:${input.enquiryId}`,
    });
    const mailed = await sendEmail(email, "Guyana Keys Lead", text);
    await recordNotice({
      email,
      channel: "email",
      kind: "enquiry",
      propertyId: input.propertyId,
      body: text,
      status: mailed,
      dedupe: `enquiry:${input.enquiryId}:email`,
    });
  } catch {
    // The enquiry is already saved.
  }
}

export async function notifyBuyer(input: {
  phone: string;
  buyerId?: string | null;
  kind: "reply" | "viewing";
  propertyId: string;
  enquiryId: string;
  text: string;
  stamp: string;
}) {
  try {
    if (!input.enquiryId || !input.text.trim() || !input.stamp) return;
    const status = await sendWhatsApp(input.phone, input.text);
    await recordNotice({
      userId: input.buyerId || null,
      phone: input.phone,
      channel: "whatsapp",
      kind: input.kind,
      propertyId: input.propertyId,
      body: input.text,
      status,
      dedupe: `${input.kind}:${input.enquiryId}:${input.stamp}`.slice(0, 240),
    });
  } catch {
    // The lead is already saved.
  }
}

export function viewingNotice(title: string, iso: string) {
  return `Viewing set for ${title}: ${whenLabel(iso) || iso}.`;
}
