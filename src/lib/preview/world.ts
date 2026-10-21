export type Actor = { id: string; name: string; kind: "agent" | "buyer"; agencyId: string; agency: string };

export type PreviewLead = {
  id: string;
  agencyId: string;
  agentId: string;
  buyerId: string;
  name: string;
  phone: string;
  note: string;
  home: string;
  area: string;
  propertyId: string;
  stage: string;
  agentReply: string;
  privateNote: string;
  viewingAt: string | null;
  viewingRequest: string | null;
  createdAt: string;
  abroad: boolean;
};

export type PreviewListing = {
  id: string;
  agencyId: string;
  agentId: string;
  title: string;
  area: string;
  status: "live" | "hidden";
  purpose: "Sale" | "Rent";
};

export type Audit = { id: string; at: string; agencyId: string; actor: string; action: string; detail: string };

export type World = {
  agencies: { id: string; name: string }[];
  listings: PreviewListing[];
  leads: PreviewLead[];
  audits: Audit[];
};

export const actors: Record<string, Actor> = {
  asha: { id: "asha", name: "Asha Persaud", kind: "agent", agencyId: "agency-a", agency: "Demerara Homes" },
  jon: { id: "jon", name: "Jon Roberts", kind: "agent", agencyId: "agency-b", agency: "Berbice Estates" },
  maria: { id: "maria", name: "Maria Singh", kind: "buyer", agencyId: "", agency: "" },
};

const hour = 36e5;

export function seedWorld(now = Date.now()): World {
  const at = new Date(now - 2 * hour).toISOString();
  return {
    agencies: [
      { id: "agency-a", name: "Demerara Homes" },
      { id: "agency-b", name: "Berbice Estates" },
    ],
    listings: [
      { id: "home-belair", agencyId: "agency-a", agentId: "asha", title: "Raised house, Bel Air Park", area: "Bel Air Park", status: "live", purpose: "Sale" },
      { id: "home-prov", agencyId: "agency-a", agentId: "asha", title: "Providence draft", area: "Providence", status: "hidden", purpose: "Sale" },
      { id: "home-berbice", agencyId: "agency-b", agentId: "jon", title: "Riverside house, New Amsterdam", area: "New Amsterdam", status: "live", purpose: "Sale" },
    ],
    leads: [
      {
        id: "lead-maria",
        agencyId: "agency-a",
        agentId: "asha",
        buyerId: "maria",
        name: "Maria Singh",
        phone: "5926000000",
        note: "I am writing from Toronto. Is Thursday afternoon possible?",
        home: "Raised house, Bel Air Park",
        area: "Bel Air Park",
        propertyId: "home-belair",
        stage: "new",
        agentReply: "",
        privateNote: "",
        viewingAt: null,
        viewingRequest: "Thursday afternoon",
        createdAt: at,
        abroad: true,
      },
      {
        id: "lead-kevin",
        agencyId: "agency-b",
        agentId: "jon",
        buyerId: "kevin",
        name: "Kevin Hall",
        phone: "5926111111",
        note: "Is the New Amsterdam house still available?",
        home: "Riverside house, New Amsterdam",
        area: "New Amsterdam",
        propertyId: "home-berbice",
        stage: "new",
        agentReply: "",
        privateNote: "",
        viewingAt: null,
        viewingRequest: null,
        createdAt: at,
        abroad: false,
      },
    ],
    audits: [
      { id: "audit-seed", at, agencyId: "agency-a", actor: "Maria Singh", action: "enquiry", detail: "Asked about Raised house, Bel Air Park" },
    ],
  };
}

function stamp(world: World, agencyId: string, actor: string, action: string, detail: string, now: number): World {
  const row: Audit = { id: "audit-" + now.toString(36) + "-" + world.audits.length, at: new Date(now).toISOString(), agencyId, actor, action, detail };
  return { ...world, audits: [row, ...world.audits].slice(0, 30) };
}

export function leadsFor(world: World, actor: Actor) {
  if (actor.kind === "buyer") return world.leads.filter((lead) => lead.buyerId === actor.id);
  return world.leads.filter((lead) => lead.agencyId === actor.agencyId);
}

export function todayFor(world: World, actor: Actor, now = Date.now()) {
  if (actor.kind !== "agent") {
    return { greetingName: actor.name, agency: "", live: 0, unanswered: 0, viewings: 0, today: [], audits: [] };
  }
  const leads = leadsFor(world, actor);
  const listings = world.listings.filter((item) => item.agencyId === actor.agencyId);
  const week = now + 7 * 24 * hour;
  const unanswered = leads.filter((lead) => !lead.agentReply.trim() && lead.stage !== "closed");
  const viewings = leads.filter((lead) => {
    if (!lead.viewingAt) return false;
    const time = new Date(lead.viewingAt).getTime();
    return time >= now && time <= week;
  });
  const actions: { id: string; text: string; href: string }[] = [];
  for (const lead of unanswered) {
    const age = (now - new Date(lead.createdAt).getTime()) / hour;
    actions.push({
      id: "reply-" + lead.id,
      text: age >= 24 ? `Reply to ${lead.name}. No reply for over 24 hours.` : `Reply to ${lead.name} about ${lead.area}.`,
      href: "/agent/leads/" + lead.id,
    });
  }
  for (const lead of leads) {
    if (lead.viewingRequest && !lead.viewingAt && lead.stage !== "closed") {
      actions.push({ id: "view-" + lead.id, text: `Confirm the viewing for ${lead.name}.`, href: "/agent/leads/" + lead.id });
    }
  }
  for (const listing of listings) {
    if (listing.status === "hidden") {
      actions.push({ id: "draft-" + listing.id, text: `Finish the ${listing.area} draft.`, href: "/agent/listings/" + listing.id });
    }
  }
  return {
    greetingName: actor.name,
    agency: actor.agency,
    live: listings.filter((item) => item.status === "live").length,
    unanswered: unanswered.length,
    viewings: viewings.length,
    today: actions.slice(0, 5),
    audits: world.audits.filter((item) => item.agencyId === actor.agencyId).slice(0, 8),
  };
}

export function leadFor(world: World, actor: Actor, id: string) {
  const lead = world.leads.find((item) => item.id === id);
  if (!lead) return { error: "That lead is not on this desk." };
  if (actor.kind === "agent" && lead.agencyId !== actor.agencyId) return { error: "That lead belongs to another agency." };
  if (actor.kind === "buyer" && lead.buyerId !== actor.id) return { error: "That enquiry is not yours." };
  return { lead };
}

export function calendarFor(world: World, actor: Actor) {
  return leadsFor(world, actor)
    .filter((lead) => lead.viewingAt)
    .map((lead) => ({ id: lead.id, name: lead.name, home: lead.home, viewingAt: lead.viewingAt, href: "/agent/leads/" + lead.id }));
}

type Change = { reply?: string; viewingAt?: string; clearViewing?: boolean; stage?: string; privateNote?: string };

export function updateLead(world: World, actor: Actor, id: string, change: Change, now = Date.now()): { world: World; error?: string } {
  const found = leadFor(world, actor, id);
  if ("error" in found && found.error) return { world, error: found.error };
  if (actor.kind !== "agent") return { world, error: "Only the agent can update this lead." };
  const lead = found.lead;
  if (!lead) return { world, error: "That lead is not on this desk." };
  const next: PreviewLead = { ...lead };
  const notes: string[] = [];
  if (typeof change.reply === "string") {
    next.agentReply = change.reply;
    if (next.stage === "new") next.stage = "contacted";
    notes.push("Reply saved");
  }
  if (change.clearViewing) {
    next.viewingAt = null;
    notes.push("Viewing cleared");
  } else if (typeof change.viewingAt === "string" && change.viewingAt) {
    next.viewingAt = new Date(change.viewingAt).toISOString();
    next.stage = "viewing";
    notes.push("Viewing set");
  }
  if (typeof change.stage === "string" && change.stage) {
    next.stage = change.stage;
    notes.push("Stage set to " + change.stage);
  }
  if (typeof change.privateNote === "string") {
    next.privateNote = change.privateNote;
    notes.push("Private note saved");
  }
  const leads = world.leads.map((item) => (item.id === id ? next : item));
  let nextWorld: World = { ...world, leads };
  for (const detail of notes) nextWorld = stamp(nextWorld, actor.agencyId, actor.name, "lead", `${lead.name}: ${detail}`, now++);
  return { world: nextWorld };
}

export function buyerView(world: World, actor: Actor) {
  const mine = leadsFor(world, actor);
  return {
    name: actor.name,
    enquiries: mine.map((lead) => ({
      id: lead.id,
      home: lead.home,
      area: lead.area,
      note: lead.note,
      reply: lead.agentReply,
      viewingAt: lead.viewingAt,
      viewingRequest: lead.viewingRequest,
      stage: lead.stage,
    })),
  };
}
