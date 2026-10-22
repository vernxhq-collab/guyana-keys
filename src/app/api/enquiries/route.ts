import { NextResponse } from "next/server";
import { clientKey, tooMany } from "../../../lib/abuse";
import { attributionFromBody } from "../../../lib/attribution";
import { newId } from "../../../lib/labels";
import { leadIntent, notifyAgentEnquiry } from "../../../lib/notify";
import { writeFlexible } from "../../../lib/rows";
import { readSession } from "../../../lib/session";
import { serviceDb } from "../../../lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (String(body.website || "").trim()) return NextResponse.json({ error: "The enquiry could not be saved." }, { status: 400 });
  if (tooMany(`${clientKey(request)}:enquiry`, 10, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many enquiries. Wait and try again." }, { status: 429 });
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const note = String(body.note || "").trim();
  if (!name || !phone) return NextResponse.json({ error: "Name and WhatsApp number are required." }, { status: 400 });
  const client = serviceDb();
  if (!client) return NextResponse.json({ error: "The enquiry could not be saved." }, { status: 503 });
  const listingId = String(body.propertyId || body.listingId || "");
  const property = listingId && listingId !== "featured" && listingId !== "scheme"
    ? await client.from("properties").select("id,title,area,agent_id").eq("id", listingId).maybeSingle()
    : { data: null };
  const session = await readSession();
  const buyerId = session?.profile?.role === "buyer" ? session.profile.id : null;
  const agentId = property.data?.agent_id ? String(property.data.agent_id) : null;
  const title = String(property.data?.title || "a home");
  const intent = buyerId ? await leadIntent(buyerId, listingId, String(property.data?.area || "")) : "";
  const id = newId("enq");
  const attribution = attributionFromBody(body, property.data ? `/listings/${listingId}` : "");
  const row: Record<string, unknown> = {
    id,
    property_id: property.data ? listingId : null,
    buyer_id: buyerId,
    agent_id: agentId,
    name,
    phone,
    note,
    stage: "new",
    source: "guyana_keys",
    intent,
    source_page: attribution.source_page,
    utm: attribution.utm,
    lead_channel: attribution.lead_channel,
    lead_kind: attribution.lead_kind,
    partner_id: attribution.partner_id,
  };
  const error = await writeFlexible((payload) => client.from("enquiries").insert(payload), row, ["source", "intent", "source_page", "utm", "lead_channel", "lead_kind", "partner_id"]);
  if (error) return NextResponse.json({ error: "The enquiry could not be saved." }, { status: 500 });
  if (agentId && property.data) {
    await notifyAgentEnquiry({
      agentId,
      buyerName: name,
      phone,
      title,
      note,
      intent,
      propertyId: listingId,
      enquiryId: id,
      page: attribution.source_page,
      channel: attribution.lead_channel,
      utm: attribution.utm,
    });
  }
  return NextResponse.json({ id });
}
