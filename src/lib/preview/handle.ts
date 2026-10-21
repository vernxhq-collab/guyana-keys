import { draftDescription, draftReply } from "../ai/local";
import { presentAgency, presentCalendar, presentCompose, presentHome, presentLead, presentLeads, presentListings, presentOutbox, presentPerformance } from "./present";
import { holdReply, saveDescription, updateLead, type Actor, type World } from "./world";

export function previewGet(world: World, actor: Actor, part: string, id: string) {
  if (actor.kind !== "agent") return { status: 403, body: { error: "This desk is for agents." } };
  if (part === "home") return { status: 200, body: presentHome(world, actor) };
  if (part === "listings") return { status: 200, body: presentListings(world, actor) };
  if (part === "leads") return { status: 200, body: presentLeads(world, actor) };
  if (part === "lead") {
    const body = presentLead(world, actor, id);
    if ("error" in body && body.error) return { status: body.error.includes("agency") || body.error.includes("Not found") ? 404 : 404, body };
    return { status: 200, body };
  }
  if (part === "calendar") return { status: 200, body: presentCalendar(world, actor) };
  if (part === "performance") return { status: 200, body: presentPerformance(world, actor) };
  if (part === "agency") return { status: 200, body: presentAgency(world, actor) };
  if (part === "outbox") return { status: 200, body: presentOutbox(world, actor) };
  if (part === "compose") return { status: 200, body: presentCompose(world, actor, id) };
  if (part === "plan") return { status: 200, body: { plan: "Starter", cap: 3, live: presentListings(world, actor).live, requests: [], preview: true } };
  if (part === "profile") {
    return { status: 200, body: { profile: { id: actor.id, name: actor.name, email: actor.id + "@preview.guyanakeys", phone: "5926000000", company: actor.agency, address: "Georgetown", areas: ["Bel Air Park"], photoUrl: "", graLicence: "", verified: false } } };
  }
  if (part === "listing") return { status: 400, body: { error: "Finish the buyer journey from Today. Listing edits are not part of this isolated test." } };
  return { status: 400, body: { error: "Unknown view." } };
}

export function previewPost(world: World, actor: Actor, body: Record<string, unknown>) {
  if (actor.kind !== "agent") return { status: 403, body: { error: "This desk is for agents." }, world };
  const action = String(body.action || "");
  if (action === "hold") {
    const result = holdReply(world, actor, String(body.id || ""), String(body.reply || ""));
    if (result.error) return { status: 400, body: { error: result.error }, world };
    return { status: 200, body: { ok: true, held: true }, world: result.world };
  }
  if (action === "describe") {
    const listing = world.listings.find((item) => item.id === String(body.id || "") && item.agencyId === actor.agencyId);
    if (!listing) return { status: 403, body: { error: "That listing is not in this agency." }, world };
    const draft = draftDescription({ title: listing.title, area: listing.area, purpose: listing.purpose, beds: listing.beds, priceGyd: listing.priceGyd, notes: String(body.notes || "") });
    return { status: 200, body: draft, world };
  }
  if (action === "saveDescription") {
    const result = saveDescription(world, actor, String(body.id || ""), String(body.description || ""));
    if (result.error) return { status: 403, body: { error: result.error }, world };
    return { status: 200, body: { ok: true }, world: result.world };
  }
  if (action === "replyDraft") {
    const found = presentLead(world, actor, String(body.id || ""));
    if ("error" in found && found.error) return { status: 403, body: { error: found.error }, world };
    const lead = world.leads.find((item) => item.id === String(body.id || ""));
    if (!lead) return { status: 400, body: { error: "That lead is not on this desk." }, world };
    return { status: 200, body: draftReply({ name: lead.name, home: lead.home, area: lead.area, note: lead.note, abroad: lead.abroad, viewingAt: lead.viewingAt }), world };
  }
  if (action !== "lead") {
    return { status: 400, body: { error: "That action is not available in this preview." }, world };
  }
  const result = updateLead(world, actor, String(body.id || ""), {
    reply: typeof body.reply === "string" ? body.reply : undefined,
    viewingAt: typeof body.viewingAt === "string" ? body.viewingAt : undefined,
    clearViewing: Boolean(body.clearViewing),
    stage: typeof body.stage === "string" ? body.stage : undefined,
    privateNote: typeof body.privateNote === "string" ? body.privateNote : undefined,
    saveDraft: Boolean(body.saveDraft),
  });
  if (result.error) return { status: result.error.includes("Not found") ? 404 : 403, body: { error: result.error }, world };
  return { status: 200, body: { ok: true }, world: result.world };
}
