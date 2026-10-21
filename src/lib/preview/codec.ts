import { seedWorld, type PreviewLead, type World } from "./world.ts";

export function encodeWorld(world: World) {
  const slim = {
    v: 2,
    leads: world.leads.map((lead) => ({
      id: lead.id,
      stage: lead.stage,
      agentReply: lead.agentReply.slice(0, 180),
      privateNote: lead.privateNote.slice(0, 100),
      viewingAt: lead.viewingAt,
      repliedAt: lead.repliedAt,
    })),
    outbox: world.outbox.slice(0, 4).map((item) => ({ ...item, body: item.body.slice(0, 140) })),
    descriptions: world.listings.filter((item) => item.description).map((item) => ({ id: item.id, description: item.description.slice(0, 140) })),
    audits: world.audits.slice(0, 5).map((item) => ({ ...item, detail: item.detail.slice(0, 80) })),
  };
  return Buffer.from(JSON.stringify(slim)).toString("base64url");
}

export function fitWorld(world: World) {
  return world;
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
