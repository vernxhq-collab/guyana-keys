import { presentCalendar, presentHome, presentLead, presentLeads, presentListings } from "./present";
import { updateLead, type Actor, type World } from "./world";

export function previewGet(world: World, actor: Actor, part: string, id: string) {
  if (actor.kind !== "agent") return { status: 403, body: { error: "This desk is for agents." } };
  if (part === "home") return { status: 200, body: presentHome(world, actor) };
  if (part === "listings") return { status: 200, body: presentListings(world, actor) };
  if (part === "leads") return { status: 200, body: presentLeads(world, actor) };
  if (part === "lead") return { status: 200, body: presentLead(world, actor, id) };
  if (part === "calendar") return { status: 200, body: presentCalendar(world, actor) };
  if (part === "plan") return { status: 200, body: { plan: "Starter", cap: 3, live: presentListings(world, actor).live, requests: [], preview: true } };
  if (part === "profile") {
    return { status: 200, body: { profile: { id: actor.id, name: actor.name, email: actor.id + "@preview.guyanakeys", phone: "5926000000", company: actor.agency, address: "Georgetown", areas: ["Bel Air Park"], photoUrl: "", graLicence: "", verified: false } } };
  }
  if (part === "listing") return { status: 400, body: { error: "Finish the buyer journey from Today. Listing edits are not part of this isolated test." } };
  return { status: 400, body: { error: "Unknown view." } };
}

export function previewPost(world: World, actor: Actor, body: Record<string, unknown>) {
  if (actor.kind !== "agent") return { status: 403, body: { error: "This desk is for agents." }, world };
  if (String(body.action || "") !== "lead") {
    return { status: 400, body: { error: "This isolated test only saves the lead, the reply, and the viewing." }, world };
  }
  const result = updateLead(world, actor, String(body.id || ""), {
    reply: typeof body.reply === "string" ? body.reply : undefined,
    viewingAt: typeof body.viewingAt === "string" ? body.viewingAt : undefined,
    clearViewing: Boolean(body.clearViewing),
    stage: typeof body.stage === "string" ? body.stage : undefined,
    privateNote: typeof body.privateNote === "string" ? body.privateNote : undefined,
  });
  if (result.error) return { status: 403, body: { error: result.error }, world };
  return { status: 200, body: { ok: true }, world: result.world };
}
