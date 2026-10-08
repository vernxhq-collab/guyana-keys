import { leadScore } from "./assist";
import { loadCatalog, resolveTouched } from "./catalog";
import type { Listing } from "./data";
import { newId, stageLabel } from "./labels";
import { addEvent, leadFromEnquiry, openEnquiry } from "./records";
import type { Profile } from "./session";
import { serviceDb } from "./supabase";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function agentForProperty(propertyId: string) {
  const db = serviceDb();
  if (!db) return null;
  const { data } = await db.from("properties").select("agent_id,title,purpose,status").eq("id", propertyId).maybeSingle();
  if (!data) return { agentId: null, title: "", purpose: "", live: false };
  return {
    agentId: data.agent_id ? String(data.agent_id) : null,
    title: String(data.title || ""),
    purpose: String(data.purpose || ""),
    live: data.status === "live",
  };
}

export async function buyerDesk(profile: Profile) {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const [saves, enquiries, searches, views] = await Promise.all([
    db.from("saved_homes").select("property_id,created_at").eq("user_id", profile.id),
    db.from("enquiries").select("id,property_id,name,phone,note,abroad,move_in,occupants,stage,agent_reply,viewing_at,viewing_request,created_at").eq("buyer_id", profile.id).order("created_at", { ascending: false }),
    db.from("saved_searches").select("id,label,purpose,area,beds,max_price,created_at").eq("user_id", profile.id).order("created_at", { ascending: false }),
    db.from("recently_viewed").select("property_id,viewed_at").eq("user_id", profile.id).order("viewed_at", { ascending: false }).limit(6),
  ]);
  const savedIds = (saves.data || []).map((row) => String(row.property_id));
  const enquiryRows = (enquiries.data || []) as Record<string, unknown>[];
  const viewIds = (views.data || []).map((row) => String(row.property_id));
  const enquiryIds = enquiryRows.map((row) => String(row.property_id || ""));
  const cleared = new Set<string>();
  const enquiryKeys = enquiryRows.map((row) => String(row.id || "")).filter(Boolean);
  if (enquiryKeys.length) {
    const events = await db.from("enquiry_events").select("enquiry_id,kind,created_at").in("enquiry_id", enquiryKeys).in("kind", ["viewing_set", "viewing_cleared"]).order("created_at", { ascending: false });
    const seen = new Set<string>();
    for (const event of events.data || []) {
      const key = String(event.enquiry_id || "");
      if (seen.has(key)) continue;
      seen.add(key);
      if (event.kind === "viewing_cleared") cleared.add(key);
    }
  }
  const found = await resolveTouched([...savedIds, ...enquiryIds, ...viewIds], savedIds);
  const homes = [...new Set([...savedIds, ...enquiryIds])]
    .map((id) => {
      const listing = found.get(id);
      if (!listing) return null;
      const enquiry = enquiryRows.find((row) => String(row.property_id) === id);
      const saved = savedIds.includes(id);
      return { listing, saved, enquiry: enquiry ? publicEnquiry(enquiry, listing, cleared.has(String(enquiry.id || ""))) : null };
    })
    .filter((item): item is { listing: Listing; saved: boolean; enquiry: ReturnType<typeof publicEnquiry> | null } => Boolean(item));
  const recent = viewIds.map((id) => found.get(id)).filter((item): item is Listing => Boolean(item));
  return {
    profile: { name: profile.name, email: profile.email, phone: profile.phone, abroad: profile.abroad },
    homes,
    enquiries: enquiryRows.map((row) => publicEnquiry(row, found.get(String(row.property_id || "")) || null, cleared.has(String(row.id || "")))),
    searches: (searches.data || []).map((row) => ({
      id: String(row.id),
      label: String(row.label || ""),
      purpose: String(row.purpose || ""),
      area: String(row.area || ""),
      beds: Number(row.beds || 0),
      maxPrice: Number(row.max_price || 0),
    })),
    recent,
  };
}

function publicEnquiry(row: Record<string, unknown>, listing: Listing | null, viewingCleared = false) {
  const viewingAt = row.viewing_at ? String(row.viewing_at) : "";
  const viewingRequest = text(row.viewing_request);
  return {
    id: text(row.id),
    propertyId: text(row.property_id),
    name: text(row.name),
    phone: text(row.phone),
    note: text(row.note),
    abroad: Boolean(row.abroad),
    moveIn: text(row.move_in),
    occupants: row.occupants == null ? null : Number(row.occupants),
    stage: text(row.stage) || "new",
    stageLabel: stageLabel(text(row.stage) || "new"),
    agentReply: text(row.agent_reply),
    viewingAt,
    viewingRequest,
    viewingCleared: viewingCleared && !viewingAt,
    listing,
  };
}

export function cardStatus(saved: boolean, enquiry: { viewingAt: string; viewingRequest: string } | null) {
  if (enquiry?.viewingAt) return "Viewing set";
  if (enquiry?.viewingRequest) return "Viewing requested";
  if (enquiry) return "Enquiry sent";
  if (saved) return "Saved";
  return "";
}

async function publicHome(propertyId: string) {
  const catalog = await loadCatalog();
  const listing = catalog.listings.find((item) => item.id === propertyId);
  if (!listing) return null;
  const home = await agentForProperty(propertyId);
  const agentId = home?.agentId && /^[0-9a-f-]{36}$/i.test(home.agentId) ? home.agentId : null;
  return { agentId, title: listing.title, purpose: listing.purpose };
}

export async function saveHome(profile: Profile, propertyId: string) {
  const db = serviceDb();
  if (!db) return { error: "The home could not be saved." };
  const home = await publicHome(propertyId);
  if (!home) return { error: "That home was not found." };
  const { error } = await db.from("saved_homes").upsert({ user_id: profile.id, property_id: propertyId }, { onConflict: "user_id,property_id" });
  if (error) return { error: "The home could not be saved." };
  return { ok: true };
}

export async function unsaveHome(profile: Profile, propertyId: string) {
  const db = serviceDb();
  if (!db) return { error: "The home could not be removed." };
  const { error } = await db.from("saved_homes").delete().eq("user_id", profile.id).eq("property_id", propertyId);
  if (error) return { error: "The home could not be removed." };
  return { ok: true };
}

export async function sendEnquiry(profile: Profile, input: { propertyId: string; name: string; phone: string; note: string; abroad: boolean; moveIn: string; occupants: number | null; viewingRequest?: string }) {
  if (!input.name.trim() || !input.phone.trim()) return { error: "Name and WhatsApp are required." };
  const home = await publicHome(input.propertyId);
  if (!home) return { error: "That home was not found." };
  const purpose = home.purpose || "Sale";
  const title = home.title || "this home";
  const opened = await openEnquiry({
    buyerId: profile.id,
    propertyId: input.propertyId,
    agentId: home?.agentId || null,
    name: input.name.trim(),
    phone: input.phone.trim(),
    note: input.note.trim(),
    abroad: input.abroad,
    moveIn: purpose === "Rent" ? input.moveIn : "",
    occupants: purpose === "Rent" ? input.occupants : null,
    viewingRequest: input.viewingRequest,
    title,
  });
  if ("error" in opened && opened.error) return { error: opened.error };
  const row = opened.row;
  const db = serviceDb();
  if (!opened.created && db) {
    const patch: Record<string, unknown> = {
      name: input.name.trim(),
      phone: input.phone.trim(),
      note: input.note.trim() || text(row.note),
      abroad: input.abroad,
    };
    if (purpose === "Rent") {
      patch.move_in = input.moveIn || text(row.move_in);
      if (input.occupants) patch.occupants = input.occupants;
    }
    if (input.viewingRequest) patch.viewing_request = input.viewingRequest;
    await db.from("enquiries").update(patch).eq("id", row.id).eq("buyer_id", profile.id);
    if (input.viewingRequest && text(row.viewing_request) !== input.viewingRequest) await addEvent(text(row.id), "viewing_requested", input.viewingRequest);
  }
  if (db) {
    const score = leadScore(leadFromEnquiry({ ...row, name: input.name, note: input.note, abroad: input.abroad, viewing_request: input.viewingRequest || row.viewing_request || null, created_at: row.created_at || new Date().toISOString(), stage: row.stage || "new", agent_reply: row.agent_reply || "" }, title));
    await db.from("enquiries").update({ score: score.score, next_step: score.nextStep }).eq("id", row.id);
  }
  return { ok: true, viewing: Boolean(input.viewingRequest) };
}

export async function saveSearch(profile: Profile, input: { label: string; purpose: string; area: string; beds: number; maxPrice: number }) {
  const db = serviceDb();
  if (!db) return { error: "The search could not be saved." };
  const { error } = await db.from("saved_searches").insert({
    id: newId("sch"),
    user_id: profile.id,
    label: input.label.slice(0, 180),
    purpose: input.purpose === "Rent" ? "Rent" : input.purpose === "Sale" ? "Sale" : "",
    area: input.area,
    beds: input.beds || 0,
    max_price: input.maxPrice || 0,
  });
  if (error) return { error: "The search could not be saved." };
  return { ok: true };
}

export async function deleteSearch(profile: Profile, id: string) {
  const db = serviceDb();
  if (!db) return { error: "The search could not be deleted." };
  const { error } = await db.from("saved_searches").delete().eq("id", id).eq("user_id", profile.id);
  if (error) return { error: "The search could not be deleted." };
  return { ok: true };
}

export async function saveBuyerProfile(profile: Profile, input: { name: string; phone: string; abroad: boolean }) {
  const db = serviceDb();
  if (!db) return { error: "The profile could not be saved." };
  const name = input.name.trim();
  if (!name) return { error: "Enter your name." };
  const { error } = await db.from("profiles").update({ name, phone: input.phone.trim(), abroad: input.abroad }).eq("id", profile.id);
  if (error) return { error: "The profile could not be saved." };
  return { ok: true };
}

export async function rememberView(profile: Profile, propertyId: string) {
  const db = serviceDb();
  if (!db || !propertyId) return { ok: true };
  await db.from("recently_viewed").upsert({ user_id: profile.id, property_id: propertyId, viewed_at: new Date().toISOString() }, { onConflict: "user_id,property_id" });
  return { ok: true };
}

export async function migrateMine(profile: Profile, saved: string[], enquired: string[]) {
  const db = serviceDb();
  if (!db) return { error: "The saved homes could not be moved." };
  const saveIds = [...new Set(saved.filter((id) => typeof id === "string" && id))];
  const enquiryIds = [...new Set(enquired.filter((id) => typeof id === "string" && id))];
  if (saveIds.length) {
    await db.from("saved_homes").upsert(saveIds.map((propertyId) => ({ user_id: profile.id, property_id: propertyId })), { onConflict: "user_id,property_id" });
  }
  for (const propertyId of enquiryIds) {
    const home = await agentForProperty(propertyId);
    await openEnquiry({
      buyerId: profile.id,
      propertyId,
      agentId: home?.agentId || null,
      name: profile.name,
      phone: profile.phone,
      note: "",
      abroad: profile.abroad,
      moveIn: "",
      occupants: null,
    });
  }
  return { ok: true };
}
