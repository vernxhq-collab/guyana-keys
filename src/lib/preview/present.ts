import { draftDescription, draftReply } from "../ai/local";
import { leadScore, whenLabel } from "../assist";
import { stageLabel } from "../labels";
import { agencyFor, calendarFor, leadFor, leadsFor, performanceFor, todayFor, type Actor, type World } from "./world";

const placeholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect fill="#12382c" width="100%" height="100%"/></svg>');

export function presentHome(world: World, actor: Actor) {
  const home = todayFor(world, actor);
  return { ...home, plan: "Starter", openRequests: 0, preview: true };
}

export function presentLead(world: World, actor: Actor, id: string) {
  const found = leadFor(world, actor, id);
  if ("error" in found && found.error) return { error: found.error };
  const lead = found.lead;
  if (!lead) return { error: "That lead is not on this desk." };
  const scored = leadScore({
    name: lead.name,
    listing: lead.home,
    stage: lead.stage,
    abroad: lead.abroad,
    note: lead.note,
    createdAt: lead.createdAt,
    agentReply: lead.agentReply,
    viewingAt: lead.viewingAt,
    viewingRequest: lead.viewingRequest,
  });
  const timeline = world.audits
    .filter((item) => item.agencyId === lead.agencyId && item.detail.startsWith(lead.name))
    .map((item) => ({ id: item.id, kind: item.action, detail: item.detail, createdAt: item.at }));
  return {
    lead: {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      note: lead.note,
      abroad: lead.abroad,
      moveIn: "",
      occupants: null,
      stage: lead.stage,
      stageLabel: stageLabel(lead.stage),
      score: scored.score,
      sentence: scored.sentence,
      nextStep: scored.nextStep,
      reminder: scored.reminder,
      viewingAt: lead.viewingAt || "",
      viewingRequest: lead.viewingRequest || "",
      home: lead.home,
      area: lead.area,
      source: "Guyana Keys preview",
      listingId: lead.propertyId,
      intent: lead.abroad ? "Buying from abroad" : "",
      privateNote: lead.privateNote,
      reviewRequested: false,
      draft: lead.agentReply || draftReply({ name: lead.name, home: lead.home, area: lead.area, note: lead.note, abroad: lead.abroad, viewingAt: lead.viewingAt }).message,
      agentReply: lead.agentReply,
      timeline,
      preview: true,
    },
  };
}

export function presentLeads(world: World, actor: Actor) {
  return {
    leads: leadsFor(world, actor).map((lead) => ({
      id: lead.id,
      name: lead.name,
      home: lead.home,
      stage: lead.stage,
      stageLabel: stageLabel(lead.stage),
      phone: lead.phone,
      note: lead.note,
      source: "Guyana Keys preview",
      listingId: lead.propertyId,
      intent: lead.abroad ? "Buying from abroad" : "",
      viewingRequest: lead.viewingRequest || "",
      viewingAt: lead.viewingAt ? whenLabel(lead.viewingAt) : "",
      agentReply: lead.agentReply,
      createdAt: lead.createdAt,
    })),
  };
}

export function presentListings(world: World, actor: Actor) {
  const rows = world.listings.filter((item) => item.agencyId === actor.agencyId);
  const leads = leadsFor(world, actor);
  return {
    live: rows.filter((item) => item.status === "live").length,
    listings: rows.map((item) => ({
      id: item.id,
      title: item.title,
      area: item.area,
      purpose: item.purpose,
      priceGyd: item.priceGyd,
      status: item.status,
      featured: false,
      image: placeholder,
      enquiries: leads.filter((lead) => lead.propertyId === item.id).length,
    })),
  };
}

export function presentCalendar(world: World, actor: Actor) {
  return { viewings: calendarFor(world, actor) };
}

export function presentPerformance(world: World, actor: Actor) {
  return performanceFor(world, actor);
}

export function presentAgency(world: World, actor: Actor) {
  return agencyFor(world, actor);
}

export function presentOutbox(world: World, actor: Actor) {
  return { messages: world.outbox.filter((item) => item.agencyId === actor.agencyId) };
}

export function presentCompose(world: World, actor: Actor, id: string) {
  const listing = world.listings.find((item) => item.id === id && item.agencyId === actor.agencyId);
  if (!listing) return { error: "That listing is not in this agency." };
  const draft = draftDescription({ title: listing.title, area: listing.area, purpose: listing.purpose, beds: listing.beds, priceGyd: listing.priceGyd });
  return { listing: { id: listing.id, title: listing.title, area: listing.area, description: listing.description || draft.description, provider: "local" } };
}
