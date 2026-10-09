import { areas } from "./areas";
import { leadScore, replyDraft } from "./assist";
import { mapProperty } from "./catalog";
import type { Listing } from "./data";
import { hoursSince, newId, planLabel, stageLabel } from "./labels";
import { addEvent, leadFromEnquiry } from "./records";
import { liveCap, type Profile } from "./session";
import { serviceDb } from "./supabase";
import { supabaseUrl } from "./supabase";

const types = ["House", "Apartment", "Land", "Commercial"];

function dbOrError() {
  const db = serviceDb();
  if (!db) return { db: null, error: "The desk is not connected." as const };
  return { db, error: null };
}

async function ownListings(agentId: string) {
  const db = serviceDb();
  if (!db) return [];
  const { data } = await db.from("properties").select("*").eq("agent_id", agentId).order("created_at", { ascending: false });
  return data || [];
}

async function ownLeads(agentId: string) {
  const db = serviceDb();
  if (!db) return [];
  const { data } = await db.from("enquiries").select("*").eq("agent_id", agentId).order("created_at", { ascending: false });
  return (data || []) as Record<string, unknown>[];
}

function titleOf(listings: Listing[], propertyId: string) {
  return listings.find((item) => item.id === propertyId)?.title || "this home";
}

export async function agentHome(profile: Profile) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const [rows, leads, requests] = await Promise.all([
    ownListings(profile.id),
    ownLeads(profile.id),
    db.from("requests").select("id,kind,status").eq("agent_id", profile.id).in("status", ["submitted", "instructions"]),
  ]);
  const listings = rows.map((row) => mapProperty(row as Record<string, unknown>));
  const live = listings.filter((item) => item.status === "live").length;
  const now = Date.now();
  const week = now + 7 * 24 * 36e5;
  const viewings = leads.filter((lead) => {
    if (!lead.viewing_at) return false;
    const time = new Date(String(lead.viewing_at)).getTime();
    return time >= now && time <= week;
  }).length;
  const unanswered = leads.filter((lead) => !(String(lead.agent_reply || "").trim()) && String(lead.stage) !== "closed").length;
  const actions: { id: string; text: string; href: string }[] = [];
  if ((requests.data || []).some((item) => item.status === "instructions")) {
    actions.push({ id: "pay-admin", text: "Pay the admin. The instructions are on Plan.", href: "/agent/plan" });
  }
  const push = (id: string, text: string, href: string) => {
    if (!actions.some((item) => item.id === id)) actions.push({ id, text, href });
  };
  for (const lead of leads) {
    const scored = leadScore(leadFromEnquiry(lead, titleOf(listings, String(lead.property_id || ""))));
    if (scored.reminder) push(`reply-${lead.id}`, `Reply to ${lead.name || "a buyer"}. No reply for over 24 hours.`, `/agent/leads/${lead.id}`);
  }
  for (const lead of leads) {
    if (lead.viewing_request && !lead.viewing_at && String(lead.stage) !== "closed") {
      push(`viewing-${lead.id}`, `Confirm the viewing for ${lead.name || "a buyer"}.`, `/agent/leads/${lead.id}`);
    }
  }
  for (const lead of leads) {
    if (!(String(lead.agent_reply || "").trim()) && String(lead.stage) === "new") {
      push(`reply-${lead.id}`, `Reply to ${lead.name || "a buyer"}.`, `/agent/leads/${lead.id}`);
    }
  }
  for (const listing of listings) {
    const thin = listing.status === "hidden" && (listing.photos?.length === 0 || listing.description.trim().length < 40 || listing.priceGyd <= 0);
    if (thin) push(`draft-${listing.id}`, `Finish the draft listing ${listing.title}.`, `/agent/listings/${listing.id}`);
  }
  return {
    plan: planLabel(profile.plan),
    live,
    cap: profile.listingCap,
    unanswered,
    viewings,
    openRequests: (requests.data || []).length,
    today: actions.slice(0, 12),
  };
}

export async function agentListings(profile: Profile) {
  const rows = await ownListings(profile.id);
  const listings = rows.map((row) => mapProperty(row as Record<string, unknown>));
  const db = serviceDb();
  const counts = new Map<string, number>();
  if (db && listings.length) {
    const { data } = await db.from("enquiries").select("property_id").eq("agent_id", profile.id);
    for (const row of data || []) {
      const id = String(row.property_id || "");
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return {
    live: listings.filter((item) => item.status === "live").length,
    cap: profile.listingCap,
    listings: listings.map((listing) => ({ ...listing, enquiries: counts.get(listing.id) || 0 })),
  };
}

export async function agentListing(profile: Profile, id: string) {
  const base = {
    live: 0,
    cap: profile.listingCap,
    listing: null as (Listing & { priceSuggested?: boolean }) | null,
  };
  const rows = await ownListings(profile.id);
  base.live = rows.filter((row) => (row as { status?: string }).status === "live").length;
  if (id === "new") return base;
  const row = rows.find((item) => String((item as { id?: string }).id) === id);
  if (!row) return { error: "That listing was not found." as const };
  return { ...base, listing: mapProperty(row as Record<string, unknown>) };
}

function cleanPhotos(value: unknown, agentId: string) {
  if (!Array.isArray(value)) return [];
  const host = supabaseUrl();
  return value
    .filter((item): item is string => typeof item === "string")
    .filter((item) => item.startsWith(`${host}/storage/v1/object/public/listing-photos/${agentId}/`))
    .slice(0, 12);
}

function listingInput(profile: Profile, body: Record<string, unknown>, existing: Record<string, unknown> | null) {
  const areaName = String(body.area || "");
  const area = areas.find((item) => item.name === areaName);
  const purpose = body.purpose === "Rent" ? "Rent" : "Sale";
  const type = types.includes(String(body.type)) ? String(body.type) : "House";
  const status = body.status === "live" ? "live" : "hidden";
  const price = Number(String(body.priceGyd ?? "").replace(/,/g, ""));
  return {
    title: String(body.title || "").trim().slice(0, 160),
    area: area?.name || "",
    region: area?.region || "",
    type,
    purpose,
    price_gyd: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
    beds: Math.max(0, Math.round(Number(body.beds) || 0)),
    baths: Math.max(0, Math.round(Number(body.baths) || 0)),
    sqft: Math.max(0, Math.round(Number(body.sqft) || 0)),
    lat: Number.isFinite(Number(body.lat)) ? Number(body.lat) : 6.8,
    lng: Number.isFinite(Number(body.lng)) ? Number(body.lng) : -58.16,
    description: String(body.description || "").slice(0, 8000),
    status,
    featured: Boolean(existing?.featured),
    photo_urls: cleanPhotos(body.photos, profile.id),
    agent_id: profile.id,
  };
}

export function listingChecks(input: { photos: string[]; lat: number; lng: number; price: number; area: string; description: string }) {
  return [
    { ok: input.photos.length > 0, label: "Add a photo." },
    { ok: Number.isFinite(input.lat) && Number.isFinite(input.lng), label: "Drop a pin on the map." },
    { ok: input.price > 0, label: "Enter a price in GYD." },
    { ok: Boolean(input.area), label: "Choose an area." },
    { ok: input.description.trim().length >= 40, label: "Write a description of 40 characters or more." },
  ];
}

export async function saveListing(profile: Profile, body: Record<string, unknown>) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const id = String(body.id || "");
  let existing: Record<string, unknown> | null = null;
  if (id && id !== "new") {
    const { data } = await db.from("properties").select("*").eq("id", id).eq("agent_id", profile.id).maybeSingle();
    if (!data) return { error: "That listing was not found." };
    existing = data as Record<string, unknown>;
  }
  const next = listingInput(profile, body, existing);
  if (next.status === "live" && existing?.status !== "live") {
    const cap = liveCap(profile.plan, profile.listingCap);
    const { count } = await db.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", profile.id).eq("status", "live");
    if ((count || 0) >= cap) {
      return { error: "cap" as const, live: count || 0, cap };
    }
  }
  if (!existing) {
    const created = newId("gy");
    const { error: insertError } = await db.from("properties").insert({ id: created, ...next, held_live: false });
    if (insertError) return { error: "The listing could not be saved." };
    return { id: created };
  }
  const { error: updateError } = await db.from("properties").update(next).eq("id", id).eq("agent_id", profile.id);
  if (updateError) return { error: "The listing could not be saved." };
  return { id };
}

export async function duplicateListing(profile: Profile, id: string) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const { data } = await db.from("properties").select("*").eq("id", id).eq("agent_id", profile.id).maybeSingle();
  if (!data) return { error: "That listing was not found." };
  const copyId = newId("gy");
  const { error: insertError } = await db.from("properties").insert({
    id: copyId,
    agent_id: profile.id,
    title: `Copy of ${data.title || "listing"}`.slice(0, 160),
    area: data.area,
    region: data.region,
    type: data.type,
    purpose: data.purpose,
    price_gyd: data.price_gyd,
    beds: data.beds,
    baths: data.baths,
    sqft: data.sqft,
    lat: data.lat,
    lng: data.lng,
    description: data.description,
    status: "hidden",
    featured: false,
    photo_urls: [],
    held_live: false,
  });
  if (insertError) return { error: "The copy could not be made." };
  return { id: copyId };
}

export async function hideListing(profile: Profile, id: string) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const { error: updateError } = await db.from("properties").update({ status: "hidden", held_live: false }).eq("id", id).eq("agent_id", profile.id);
  if (updateError) return { error: "The listing could not be hidden." };
  return { ok: true };
}

export async function deleteListing(profile: Profile, id: string) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const { error: deleteError } = await db.from("properties").delete().eq("id", id).eq("agent_id", profile.id);
  if (deleteError) return { error: "The listing could not be deleted." };
  return { ok: true };
}

function publicLead(row: Record<string, unknown>, listing: Listing | undefined) {
  const scored = leadScore(leadFromEnquiry(row, listing?.title || "this home"));
  return {
    id: String(row.id),
    propertyId: String(row.property_id || ""),
    name: String(row.name || ""),
    phone: String(row.phone || ""),
    note: String(row.note || ""),
    abroad: Boolean(row.abroad),
    moveIn: String(row.move_in || ""),
    occupants: row.occupants == null ? null : Number(row.occupants),
    stage: String(row.stage || "new"),
    stageLabel: stageLabel(String(row.stage || "new")),
    agentReply: String(row.agent_reply || ""),
    score: scored.score,
    sentence: scored.sentence,
    nextStep: scored.nextStep,
    reminder: scored.reminder,
    viewingAt: row.viewing_at ? String(row.viewing_at) : "",
    viewingRequest: String(row.viewing_request || ""),
    createdAt: String(row.created_at || ""),
    waitingHours: hoursSince(String(row.created_at || "")),
    home: listing ? listing.title : "Home removed",
    area: listing?.area || "",
    purpose: listing?.purpose || "",
  };
}

export async function agentLeadList(profile: Profile) {
  const [leads, rows] = await Promise.all([ownLeads(profile.id), ownListings(profile.id)]);
  const listings = rows.map((row) => mapProperty(row as Record<string, unknown>));
  return { leads: leads.map((lead) => publicLead(lead, listings.find((item) => item.id === String(lead.property_id || "")))) };
}

export async function agentLead(profile: Profile, id: string) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const { data } = await db.from("enquiries").select("*").eq("id", id).eq("agent_id", profile.id).maybeSingle();
  if (!data) return { error: "That lead was not found." };
  const row = data as Record<string, unknown>;
  const property = row.property_id ? await db.from("properties").select("*").eq("id", String(row.property_id)).eq("agent_id", profile.id).maybeSingle() : { data: null };
  const listing = property.data ? mapProperty(property.data as Record<string, unknown>) : undefined;
  const events = await db.from("enquiry_events").select("id,kind,detail,created_at").eq("enquiry_id", id).order("created_at", { ascending: false });
  const reviews = await db.from("review_requests").select("id").eq("enquiry_id", id).eq("agent_id", profile.id).limit(1);
  const scored = leadScore(leadFromEnquiry(row, listing?.title || "this home"));
  await db.from("enquiries").update({ score: scored.score, next_step: scored.nextStep }).eq("id", id).eq("agent_id", profile.id);
  const drafts = (events.data || []).filter((event) => event.kind === "reply_drafted");
  return {
    lead: {
      ...publicLead(row, listing),
      privateNote: String(row.private_note || ""),
      reviewRequested: Boolean(reviews.data?.length),
      draft: drafts[0] ? String(drafts[0].detail || "") : replyDraft({ name: String(row.name || ""), listing: listing?.title || "this home", viewingAt: row.viewing_at ? String(row.viewing_at) : null }).message,
      timeline: (events.data || []).map((event) => ({
        id: String(event.id),
        kind: String(event.kind),
        detail: String(event.detail || ""),
        createdAt: String(event.created_at || ""),
      })),
    },
  };
}

export async function updateLead(profile: Profile, body: Record<string, unknown>) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const id = String(body.id || "");
  const { data } = await db.from("enquiries").select("*").eq("id", id).eq("agent_id", profile.id).maybeSingle();
  if (!data) return { error: "That lead was not found." };
  const row = data as Record<string, unknown>;
  const property = row.property_id ? await db.from("properties").select("title").eq("id", String(row.property_id)).maybeSingle() : { data: null };
  const title = String(property.data?.title || "this home");
  const patch: Record<string, unknown> = {};
  if (typeof body.privateNote === "string") patch.private_note = body.privateNote.slice(0, 4000);
  if (typeof body.stage === "string" && ["new", "contacted", "viewing", "offer", "closed"].includes(body.stage) && body.stage !== row.stage) {
    patch.stage = body.stage;
    await addEvent(id, "stage_changed", `${stageLabel(String(row.stage || "new"))} to ${stageLabel(body.stage)}`);
  }
  if (body.clearViewing) {
    patch.viewing_at = null;
    await addEvent(id, "viewing_cleared", "The viewing time was removed.");
  } else if (typeof body.viewingAt === "string" && body.viewingAt) {
    const time = new Date(body.viewingAt);
    if (Number.isNaN(time.getTime())) return { error: "Enter a real date and time." };
    patch.viewing_at = time.toISOString();
    const draft = replyDraft({ name: String(row.name || ""), listing: title, viewingAt: time.toISOString() });
    await addEvent(id, "viewing_set", time.toISOString());
    await addEvent(id, "reply_drafted", draft.message);
    if (!patch.stage && (row.stage === "new" || row.stage === "contacted")) {
      patch.stage = "viewing";
      await addEvent(id, "stage_changed", `${stageLabel(String(row.stage))} to Viewing`);
    }
  }
  if (body.openWhatsapp) {
    const message = String(body.reply || "").trim();
    if (message) patch.agent_reply = message.slice(0, 2000);
    if ((patch.stage || row.stage) === "new") {
      patch.stage = "contacted";
      await addEvent(id, "stage_changed", "New to Contacted");
    }
  } else if (typeof body.reply === "string" && body.saveDraft) {
    await addEvent(id, "reply_drafted", body.reply.slice(0, 2000));
  }
  if (body.askReview) {
    if ((patch.stage || row.stage) !== "closed") return { error: "Ask for a review after the lead is closed." };
    const { data: existing } = await db.from("review_requests").select("id").eq("enquiry_id", id).eq("agent_id", profile.id).limit(1);
    if (!existing?.length) {
      await db.from("review_requests").insert({ id: newId("rev"), enquiry_id: id, agent_id: profile.id, buyer_id: row.buyer_id || null });
      await addEvent(id, "review_asked", "Review requested");
    }
  }
  const merged = { ...row, ...patch };
  const scored = leadScore(leadFromEnquiry(merged, title));
  patch.score = scored.score;
  patch.next_step = scored.nextStep;
  const saved = await db.from("enquiries").update(patch).eq("id", id).eq("agent_id", profile.id);
  if (saved.error) return { error: "The lead could not be saved." };
  return { ok: true };
}

export async function createRequest(profile: Profile, body: Record<string, unknown>) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const kind = body.kind === "feature" || body.kind === "plan" || body.kind === "help" ? body.kind : "";
  if (!kind) return { error: "Choose a request." };
  if (kind === "plan") {
    if (profile.plan === "agency") return { error: "This account is already on a paid plan." };
    const { data } = await db.from("requests").select("id,status").eq("agent_id", profile.id).eq("kind", "plan");
    if ((data || []).some((item) => item.status === "submitted" || item.status === "instructions")) {
      return { error: "A package request is already with the admin." };
    }
  }
  let propertyId: string | null = null;
  let listingTitle = "a listing";
  if (kind === "feature") {
    propertyId = String(body.propertyId || "");
    const { data } = await db.from("properties").select("id,status,title,featured").eq("id", propertyId).eq("agent_id", profile.id).maybeSingle();
    if (!data || data.status !== "live") return { error: "Pick a live listing." };
    if (data.featured) return { error: "This listing is already featured." };
    listingTitle = String(data.title || "a listing");
    const open = await db.from("requests").select("id,status").eq("agent_id", profile.id).eq("kind", "feature").eq("property_id", propertyId);
    if ((open.data || []).some((item) => item.status === "submitted" || item.status === "instructions")) {
      return { error: "That listing already has a feature request with the admin." };
    }
  }
  const typed = `${String(body.subject || "").trim()}${body.message ? `\n${String(body.message).trim()}` : ""}`.trim();
  if (kind === "help" && typed.length < 3) return { error: "Write a subject and a message." };
  const message = typed || (kind === "plan"
    ? "Asked to upgrade the package. Payment is with the admin."
    : `Asked to feature ${listingTitle}. Payment is with the admin.`);
  const { error: insertError } = await db.from("requests").insert({
    id: newId("req"),
    agent_id: profile.id,
    kind,
    property_id: propertyId,
    status: "submitted",
    instructions: "",
    message,
  });
  if (insertError) return { error: "The request could not be sent." };
  return { ok: true };
}

export async function agentPlan(profile: Profile) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const [requests, rows] = await Promise.all([
    db.from("requests").select("id,kind,property_id,status,instructions,message,created_at").eq("agent_id", profile.id).order("created_at", { ascending: false }),
    ownListings(profile.id),
  ]);
  const listings = rows.map((row) => mapProperty(row as Record<string, unknown>));
  const liveListings = listings.filter((item) => item.status === "live");
  return {
    plan: planLabel(profile.plan),
    cap: profile.listingCap,
    live: liveListings.length,
    requests: (requests.data || []).map((row) => {
      const listing = listings.find((item) => item.id === String(row.property_id || ""));
      return { ...row, listing: listing?.title || "", featured: Boolean(listing?.featured) };
    }),
    liveListings: liveListings.map((item) => ({ id: item.id, title: item.title, area: item.area, featured: Boolean(item.featured) })),
  };
}

export async function saveAgentProfile(profile: Profile, body: Record<string, unknown>) {
  const { db, error } = dbOrError();
  if (!db) return { error };
  const name = String(body.name || "").trim();
  if (!name) return { error: "Enter your name." };
  const allowed = new Set(areas.map((item) => item.name));
  const picked = Array.isArray(body.areas) ? body.areas.map(String).filter((item) => allowed.has(item)) : [];
  let photo = profile.photoUrl;
  if (typeof body.photoUrl === "string" && body.photoUrl) {
    const host = supabaseUrl();
    if (body.photoUrl.startsWith(`${host}/storage/v1/object/public/listing-photos/${profile.id}/`)) photo = body.photoUrl;
  }
  const { error: updateError } = await db.from("profiles").update({
    name,
    company: String(body.company || "").trim().slice(0, 120),
    phone: String(body.phone || "").trim().slice(0, 40),
    areas: picked,
    photo_url: photo,
  }).eq("id", profile.id);
  if (updateError) return { error: "The profile could not be saved." };
  return { ok: true };
}
