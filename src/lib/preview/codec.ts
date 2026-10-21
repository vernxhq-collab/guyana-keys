import { seedWorld, type PreviewLead, type World } from "./world.ts";

const COOKIE_LIMIT = 3800;

type Pack = { replies: number; notes: number; outbox: number; body: number; descriptions: number; audits: number; detail: number };

function pack(world: World, limits: Pack) {
  const slim = {
    v: 2,
    leads: world.leads.map((lead) => ({
      id: lead.id,
      stage: lead.stage,
      agentReply: lead.agentReply.slice(0, limits.replies),
      privateNote: lead.privateNote.slice(0, limits.notes),
      viewingAt: lead.viewingAt,
      repliedAt: lead.repliedAt,
    })),
    outbox: limits.outbox === 0 ? [] : world.outbox.slice(0, limits.outbox).map((item) => ({ ...item, body: item.body.slice(0, limits.body) })),
    descriptions: limits.descriptions === 0 ? [] : world.listings.filter((item) => item.description).map((item) => ({ id: item.id, description: item.description.slice(0, limits.descriptions) })),
    audits: limits.audits === 0 ? [] : world.audits.slice(0, limits.audits).map((item) => ({ ...item, detail: item.detail.slice(0, limits.detail) })),
  };
  return Buffer.from(JSON.stringify(slim)).toString("base64url");
}

export function encodeWorld(world: World) {
  const limits: Pack = { replies: 180, notes: 100, outbox: 4, body: 140, descriptions: 140, audits: 5, detail: 80 };
  let encoded = pack(world, limits);
  const cuts: Partial<Pack>[] = [
    { audits: 2, detail: 40 },
    { audits: 0 },
    { descriptions: 40 },
    { descriptions: 0 },
    { outbox: 2, body: 80 },
    { outbox: 1, body: 40 },
    { outbox: 0 },
    { notes: 0, replies: 40 },
    { notes: 0, replies: 0 },
  ];
  for (const cut of cuts) {
    if (encoded.length <= COOKIE_LIMIT) break;
    Object.assign(limits, cut);
    encoded = pack(world, limits);
  }
  return encoded;
}

export function fitWorld(world: World): World {
  return {
    ...world,
    leads: world.leads.map((lead) => ({
      ...lead,
      note: lead.note.slice(0, 180),
      agentReply: lead.agentReply.slice(0, 180),
      privateNote: lead.privateNote.slice(0, 100),
    })),
    outbox: world.outbox.slice(0, 4).map((item) => ({ ...item, body: item.body.slice(0, 140) })),
    listings: world.listings.map((item) => ({ ...item, description: item.description.slice(0, 140) })),
    audits: world.audits.slice(0, 5).map((item) => ({ ...item, detail: item.detail.slice(0, 80) })),
  };
}

export function decodeWorld(raw: string | undefined): World {
  const seed = seedWorld();
  if (!raw) return seed;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as { v?: number; leads?: PreviewLead[]; outbox?: World["outbox"]; descriptions?: { id: string; description: string }[]; audits?: World["audits"] };
    if (parsed.v !== 2 || !Array.isArray(parsed.leads)) return seed;
    return {
      ...seed,
      leads: seed.leads.map((lead) => {
        const saved = parsed.leads?.find((item) => item.id === lead.id);
        return saved ? { ...lead, stage: saved.stage || lead.stage, agentReply: String(saved.agentReply || "").slice(0, 180), privateNote: String(saved.privateNote || "").slice(0, 100), viewingAt: saved.viewingAt || null, repliedAt: saved.repliedAt || null } : lead;
      }),
      outbox: Array.isArray(parsed.outbox) ? parsed.outbox.slice(0, 4) : [],
      listings: seed.listings.map((item) => {
        const saved = parsed.descriptions?.find((row) => row.id === item.id);
        return saved ? { ...item, description: String(saved.description || "").slice(0, 140) } : item;
      }),
      audits: parsed.audits?.length ? parsed.audits.slice(0, 5) : seed.audits,
    };
  } catch {
    return seed;
  }
}
