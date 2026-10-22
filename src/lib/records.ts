import { replyDraft, type LeadInput } from "./assist";
import type { LeadAttribution } from "./attribution";
import { newId } from "./labels";
import { writeFlexible } from "./rows";
import { serviceDb } from "./supabase";

export async function addEvent(enquiryId: string, kind: string, detail = "") {
  const db = serviceDb();
  if (!db || !enquiryId) return;
  await db.from("enquiry_events").insert({ id: newId("evt"), enquiry_id: enquiryId, kind, detail });
}

export function leadFromEnquiry(row: Record<string, unknown>, listingTitle: string): LeadInput {
  return {
    name: String(row.name || ""),
    listing: listingTitle,
    stage: String(row.stage || "new"),
    abroad: Boolean(row.abroad),
    note: String(row.note || ""),
    createdAt: String(row.created_at || ""),
    agentReply: String(row.agent_reply || ""),
    viewingAt: row.viewing_at ? String(row.viewing_at) : null,
    viewingRequest: row.viewing_request ? String(row.viewing_request) : null,
  };
}

export async function openEnquiry(input: {
  buyerId: string;
  propertyId: string;
  agentId: string | null;
  name: string;
  phone: string;
  note: string;
  abroad: boolean;
  moveIn: string;
  occupants: number | null;
  viewingRequest?: string;
  title?: string;
  intent?: string;
  attribution?: LeadAttribution;
}) {
  const db = serviceDb();
  if (!db) return { error: "The enquiry could not be saved." as const };
  const { data: existing } = await db
    .from("enquiries")
    .select("*")
    .eq("buyer_id", input.buyerId)
    .eq("property_id", input.propertyId)
    .order("created_at", { ascending: false })
    .limit(1);
  const current = existing?.[0] as Record<string, unknown> | undefined;
  if (current) return { row: current, created: false };
  const id = newId("enq");
  const draft = replyDraft({ name: input.name, listing: input.title || "this home" });
  const row = {
    id,
    property_id: input.propertyId,
    buyer_id: input.buyerId,
    agent_id: input.agentId,
    name: input.name,
    phone: input.phone,
    note: input.note,
    abroad: input.abroad,
    move_in: input.moveIn,
    occupants: input.occupants,
    stage: "new",
    agent_reply: "",
    score: "New",
    next_step: input.viewingRequest ? "Confirm the viewing" : "Reply today",
    viewing_request: input.viewingRequest || null,
    private_note: "",
    source: "guyana_keys",
    intent: input.intent || "",
    source_page: input.attribution?.source_page || "",
    utm: input.attribution?.utm || {},
    lead_channel: input.attribution?.lead_channel || "web",
    lead_kind: input.attribution?.lead_kind || "enquiry",
    partner_id: input.attribution?.partner_id || "",
  };
  const error = await writeFlexible((payload) => db.from("enquiries").insert(payload), row, ["source", "intent", "source_page", "utm", "lead_channel", "lead_kind", "partner_id"]);
  if (error) return { error: "The enquiry could not be saved." as const };
  await addEvent(id, "enquiry_received", input.note || "");
  await addEvent(id, "reply_drafted", draft.message);
  if (input.viewingRequest) await addEvent(id, "viewing_requested", input.viewingRequest);
  return { row: row as Record<string, unknown>, created: true };
}
