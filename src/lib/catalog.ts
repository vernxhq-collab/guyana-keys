import { type Agent, type Listing } from "./data";
import { badgesFor } from "./phase1-desk";
import { factsFromRow } from "./place-facts";
import { centerForArea } from "./areas";
import { siteFromRow } from "./site-facts";
import { sampleAgents, sampleListingById, sampleListings } from "./sample-data";
import { serviceDb } from "./supabase";
import { cleanTitleStatus } from "./trust";

/** Sample homes and agents are for local dev only. Production never uses them, even if the flag is set. */
export function sampleDataEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.GUYANA_KEYS_SAMPLE_DATA === "1";
}

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
  const latNumber = row.lat === null || row.lat === undefined || row.lat === "" ? null : Number(row.lat);
  const lngNumber = row.lng === null || row.lng === undefined || row.lng === "" ? null : Number(row.lng);
  const pinned = latNumber !== null && lngNumber !== null && Number.isFinite(latNumber) && Number.isFinite(lngNumber);
  const areaName = text(row.area);
  const center = centerForArea(areaName);
  return {
    id: text(row.id),
    title: text(row.title, "Untitled home"),
    area: areaName,
    region: text(row.region),
    type: text(row.type, "House") || "House",
    purpose,
    priceGyd: Number(row.price_gyd || 0) || 0,
    beds: Number(row.beds || 0) || 0,
    baths: Number(row.baths || 0) || 0,
    sqft: Number(row.sqft || 0) || 0,
    lat: pinned ? latNumber : (center?.lat ?? 6.8),
    lng: pinned ? lngNumber : (center?.lng ?? -58.16),
    pinned,
    image: photos[0] || photoPlaceholder,
    photos,
    description: text(row.description),
    agentId: text(row.agent_id),
    featured: Boolean(row.featured),
    status,
    titleRef: text(row.title_ref),
    titleStatus: cleanTitleStatus(row.title_status),
    titleCheckedByLawyer: row.title_checked_by_lawyer === true,
    titleLawyerPartnerId: text(row.title_lawyer_partner_id),
    titleCheckedOn: text(row.title_checked_on).slice(0, 10),
    facts: factsFromRow(row),
    site: siteFromRow(row),
    createdAt: text(row.created_at),
    priceReduced: row.price_reduced === true,
  };
}

function sampleCatalog(): { source: "sample"; listings: Listing[] } | null {
  if (!sampleDataEnabled()) return null;
  return { source: "sample", listings: sampleListings };
}

export async function loadCatalog(): Promise<{ source: "db" | "sample" | "none"; listings: Listing[] }> {
  try {
    const db = serviceDb();
    if (!db) return sampleCatalog() || { source: "none", listings: [] };
    const { data, error } = await db.from("properties").select("*").eq("status", "live").order("created_at", { ascending: false });
    if (error) return sampleCatalog() || { source: "none", listings: [] };
    if (!data?.length) return sampleCatalog() || { source: "db", listings: [] };
    const agentIds = [...new Set(data.map((row) => String((row as { agent_id?: string }).agent_id || "")).filter(Boolean))];
    let suspended = new Set<string>();
    if (agentIds.length) {
      const profiles = await db.from("profiles").select("id,suspended").in("id", agentIds);
      suspended = new Set((profiles.data || []).filter((row) => (row as { suspended?: boolean }).suspended).map((row) => String((row as { id: string }).id)));
    }
    const live = data
      .map((row) => mapProperty(row as Record<string, unknown>))
      .filter((item) => item.agentId && !suspended.has(item.agentId));
    if (!live.length) return sampleCatalog() || { source: "db", listings: [] };
    return { source: "db", listings: live };
  } catch {
    return sampleCatalog() || { source: "none", listings: [] };
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
  if (sampleDataEnabled()) {
    for (const id of unique) {
      if (found.has(id)) continue;
      const sample = sampleListingById(id);
      if (sample && (saved.has(id) || sampleListings.some((item) => item.id === id))) found.set(id, sample);
    }
  }
  return found;
}

function mapAgent(data: Record<string, unknown>): Agent | null {
  if (!data || data.suspended || data.role !== "agent") return null;
  const name = text(data.name).trim();
  if (!name) return null;
  return {
    id: text(data.id),
    name,
    company: text(data.company),
    phone: text(data.phone),
    address: text(data.address),
    areas: Array.isArray(data.areas) ? data.areas.map(String) : [],
    image: text(data.photo_url),
    graLicence: text(data.gra_licence),
    verified: Boolean(data.verified),
    founding: data.founding_agent === true,
  };
}

export async function loadPublicAgents(): Promise<Agent[]> {
  try {
    const db = serviceDb();
    if (db) {
      const { data, error } = await db.from("profiles").select("*").eq("role", "agent").eq("suspended", false);
      if (!error && data?.length) {
        const people = data.map((row) => mapAgent(row as Record<string, unknown>)).filter((agent): agent is Agent => agent !== null);
        if (people.length) {
          const badges = await badgesFor(people.map((agent) => agent.id)).catch(() => ({} as Record<string, string>));
          return people.map((agent) => ({ ...agent, checkBadge: badges[agent.id] || "" }));
        }
      }
    }
  } catch {
    // An empty directory is more honest than invented names.
  }
  return sampleDataEnabled() ? sampleAgents : [];
}

export async function publicAgent(agentId: string): Promise<Agent | null> {
  if (!agentId) return null;
  if (sampleDataEnabled()) {
    const sample = sampleAgents.find((item) => item.id === agentId);
    if (sample) return sample;
  }
  try {
    const db = serviceDb();
    if (!db) return null;
    const { data } = await db.from("profiles").select("*").eq("id", agentId).maybeSingle();
    if (!data || data.suspended || (data.role !== "agent" && data.role !== "admin")) return null;
    return {
      id: String(data.id),
      name: String(data.name || "Agent"),
      company: String(data.company || ""),
      phone: String(data.phone || ""),
      address: String(data.address || ""),
      areas: Array.isArray(data.areas) ? data.areas.map(String) : [],
      image: String(data.photo_url || ""),
      graLicence: String(data.gra_licence || ""),
      verified: Boolean(data.verified),
      founding: data.founding_agent === true,
      checkBadge: (await badgesFor([String(data.id)]).catch(() => ({} as Record<string, string>)))[String(data.id)] || "",
    };
  } catch {
    return null;
  }
}
