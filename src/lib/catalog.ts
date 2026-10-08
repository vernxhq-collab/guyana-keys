import { agents, listingById, listings as sampleListings, type Agent, type Listing } from "./data";
import { serviceDb } from "./supabase";

export const photoPlaceholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect fill="#e7eae8" width="100%" height="100%"/><text x="50%" y="50%" fill="#66716c" font-family="sans-serif" font-size="28" text-anchor="middle">No photo yet</text></svg>');

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function mapProperty(row: Record<string, unknown>): Listing {
  const photos = Array.isArray(row.photo_urls) ? row.photo_urls.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
  const purpose = text(row.purpose, "Sale") === "Rent" ? "Rent" : "Sale";
  const status = text(row.status) === "live" ? "live" : "hidden";
  return {
    id: text(row.id),
    title: text(row.title, "Untitled home"),
    area: text(row.area),
    region: text(row.region),
    type: text(row.type, "House") || "House",
    purpose,
    priceGyd: Number(row.price_gyd || 0) || 0,
    beds: Number(row.beds || 0) || 0,
    baths: Number(row.baths || 0) || 0,
    sqft: Number(row.sqft || 0) || 0,
    lat: Number(row.lat ?? 6.8) || 6.8,
    lng: Number(row.lng ?? -58.16) || -58.16,
    image: photos[0] || photoPlaceholder,
    photos,
    description: text(row.description),
    agentId: text(row.agent_id),
    featured: Boolean(row.featured),
    status,
  };
}

export async function loadCatalog(): Promise<{ source: "db" | "sample"; listings: Listing[] }> {
  try {
    const db = serviceDb();
    if (!db) return { source: "sample", listings: sampleListings };
    const { data, error } = await db.from("properties").select("*").eq("status", "live").order("created_at", { ascending: false });
    if (error || !data?.length) return { source: "sample", listings: sampleListings };
    const agentIds = [...new Set(data.map((row) => String((row as { agent_id?: string }).agent_id || "")).filter(Boolean))];
    let suspended = new Set<string>();
    if (agentIds.length) {
      const profiles = await db.from("profiles").select("id,suspended").in("id", agentIds);
      suspended = new Set((profiles.data || []).filter((row) => (row as { suspended?: boolean }).suspended).map((row) => String((row as { id: string }).id)));
    }
    const live = data
      .map((row) => mapProperty(row as Record<string, unknown>))
      .filter((item) => item.agentId && !suspended.has(item.agentId));
    if (!live.length) return { source: "sample", listings: sampleListings };
    return { source: "db", listings: live };
  } catch {
    return { source: "sample", listings: sampleListings };
  }
}

export async function resolveTouched(ids: string[], savedIds: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const saved = new Set(savedIds);
  const found = new Map<string, Listing>();
  if (!unique.length) return found;
  try {
    const db = serviceDb();
    if (db) {
      const { data } = await db.from("properties").select("*").in("id", unique);
      for (const row of data || []) {
        const listing = mapProperty(row as Record<string, unknown>);
        found.set(listing.id, listing);
      }
    }
  } catch {
    // Sample ids still resolve below when the buyer already saved them.
  }
  const catalog = await loadCatalog();
  for (const id of unique) {
    if (found.has(id)) continue;
    const sample = listingById(id);
    if (!sample) continue;
    if (catalog.source === "sample" || saved.has(id)) found.set(id, sample);
  }
  return found;
}

export async function publicAgent(agentId: string): Promise<Agent | null> {
  const sample = agents.find((item) => item.id === agentId);
  if (sample) return sample;
  if (!agentId) return null;
  try {
    const db = serviceDb();
    if (!db) return null;
    const { data } = await db.from("profiles").select("id,name,company,phone,areas,photo_url,role,suspended").eq("id", agentId).maybeSingle();
    if (!data || data.role !== "agent" || data.suspended) return null;
    return {
      id: String(data.id),
      name: String(data.name || "Agent"),
      company: String(data.company || ""),
      phone: String(data.phone || ""),
      areas: Array.isArray(data.areas) ? data.areas.map(String) : [],
      image: String(data.photo_url || ""),
    };
  } catch {
    return null;
  }
}
