import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { nearbyGroupMeta, nearbyRadiusKm, outsideGuyanaReport, type NearbyGroup, type NearbyPlace, type NearbyReport } from "./nearby";

export type { NearbyGroup, NearbyPlace, NearbyReport } from "./nearby";
export { nearbyRadiusKm } from "./nearby";

type OsmElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

const endpoints = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

const radiusM = nearbyRadiusKm * 1000;
const cacheVersion = "v5";
const successTtl = 7 * 24 * 60 * 60 * 1000;
const failureTtl = 10 * 60 * 1000;
const memory = new Map<string, { at: number; ttl: number; report: NearbyReport }>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(5)}_${lng.toFixed(5)}_${cacheVersion}`;
}

function cacheFile(key: string) {
  return join(tmpdir(), "guyana-keys-poi", `${key}.json`);
}

function readEntry(key: string) {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < hit.ttl) return hit;
  try {
    const parsed = JSON.parse(readFileSync(cacheFile(key), "utf8")) as { at: number; ttl: number; report: NearbyReport };
    if (Date.now() - parsed.at < parsed.ttl) {
      memory.set(key, parsed);
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function writeCache(key: string, report: NearbyReport, ttl: number) {
  const entry = { at: Date.now(), ttl, report };
  memory.set(key, entry);
  try {
    const dir = join(tmpdir(), "guyana-keys-poi");
    mkdirSync(dir, { recursive: true });
    writeFileSync(cacheFile(key), JSON.stringify(entry));
  } catch {
    // The memory cache still serves this process.
  }
}

export function peekNearby(lat: number, lng: number): NearbyReport | null {
  if (!inGuyana(lat, lng)) return outsideGuyanaReport();
  return readEntry(cacheKey(lat, lng))?.report || null;
}

function inGuyana(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 1 && lat <= 9 && lng >= -62 && lng <= -56;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)));
}

function query(lat: number, lng: number, clauses: string[]) {
  const body = clauses.map((clause) => `${clause}(around:${radiusM},${lat},${lng});`).join("");
  return `[out:json][timeout:18];(${body});out center;`;
}

async function overpass(data: string): Promise<OsmElement[] | null> {
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "GuyanaKeys/1.0 (nearby places; https://www.openstreetmap.org/copyright)",
        },
        body: new URLSearchParams({ data }),
        signal: AbortSignal.timeout(18000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = await res.json() as { elements?: OsmElement[] };
      if (!Array.isArray(json.elements)) continue;
      return json.elements;
    } catch {
      continue;
    }
  }
  return null;
}

async function overpassClauses(lat: number, lng: number, clauses: string[]): Promise<OsmElement[] | null> {
  const together = await overpass(query(lat, lng, clauses));
  if (together) return together;
  if (clauses.length === 1) return null;
  const parts = await Promise.all(clauses.map((clause) => overpass(query(lat, lng, [clause]))));
  if (parts.every((item) => item === null)) return null;
  return parts.flatMap((item) => item || []);
}

function point(element: OsmElement) {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat: lat as number, lng: lng as number };
}

function kindOf(tags: Record<string, string>) {
  const amenity = tags.amenity || "";
  const shop = tags.shop || "";
  if (amenity === "school") return "School";
  if (amenity === "kindergarten") return "Kindergarten";
  if (amenity === "college" || amenity === "university") return "College";
  if (amenity === "hospital") return "Hospital";
  if (amenity === "clinic" || amenity === "doctors") return "Clinic";
  if (amenity === "pharmacy") return "Pharmacy";
  if (tags.highway === "bus_stop") return "Bus stop";
  if (amenity === "bus_station") return "Bus park";
  if (amenity === "ferry_terminal") return /stelling/i.test(tags.name || "") ? "Stelling" : "Ferry terminal";
  if (tags.leisure === "park") return "Park";
  if (tags.aeroway === "aerodrome" || tags.aeroway === "airstrip") return "Airport";
  if (amenity === "marketplace") return "Market";
  if (shop === "supermarket") return "Supermarket";
  if (shop === "mall") return "Mall";
  if (shop === "convenience" || shop === "general") return "Shop";
  return "Place";
}

function toPlaces(elements: OsmElement[], lat: number, lng: number): NearbyPlace[] {
  const seen = new Set<string>();
  const places: (NearbyPlace & { named: boolean })[] = [];
  for (const element of elements) {
    const id = `${element.type || "n"}/${element.id || ""}`;
    if (!element.id || seen.has(id)) continue;
    const where = point(element);
    if (!where) continue;
    const tags = element.tags || {};
    const kind = kindOf(tags);
    const km = haversineKm(lat, lng, where.lat, where.lng);
    if (km > nearbyRadiusKm + 0.05) continue;
    const namedText = (tags.name || tags["name:en"] || "").trim();
    const named = /[a-z]/i.test(namedText);
    seen.add(id);
    places.push({
      id,
      name: named ? namedText : kind,
      kind,
      km,
      mi: km * 0.621371,
      named,
    });
  }
  places.sort((a, b) => a.km - b.km);
  const names = new Set<string>();
  const take = (list: typeof places, limit: number) => {
    const picked: NearbyPlace[] = [];
    for (const place of list) {
      const key = place.name.trim().toLowerCase();
      if (names.has(key)) continue;
      names.add(key);
      picked.push({
        id: place.id,
        name: place.named ? place.name : `Unnamed ${place.kind.toLowerCase()}`,
        kind: place.kind,
        km: place.km,
        mi: place.mi,
      });
      if (picked.length === limit) break;
    }
    return picked;
  };
  const named = take(places.filter((place) => place.named), 5);
  if (named.length >= 3) return named;
  return [...named, ...take(places.filter((place) => !place.named), 3 - named.length)];
}

const groupQueries: { id: NearbyGroup["id"]; queries: string[][] }[] = [
  {
    id: "schools",
    queries: [[
      'node["amenity"="school"]',
      'node["amenity"="kindergarten"]',
      'node["amenity"="college"]',
      'node["amenity"="university"]',
    ]],
  },
  {
    id: "health",
    queries: [[
      'node["amenity"="hospital"]',
      'node["amenity"="clinic"]',
      'node["amenity"="doctors"]',
      'node["amenity"="pharmacy"]',
    ]],
  },
  {
    id: "getting-around",
    queries: [
      [
        'node["highway"="bus_stop"]',
        'node["amenity"="bus_station"]',
        'node["amenity"="ferry_terminal"]',
        'node["aeroway"="aerodrome"]',
        'node["aeroway"="airstrip"]',
      ],
      [
        'way["leisure"="park"]',
        'node["leisure"="park"]',
        'way["aeroway"="aerodrome"]',
        'way["aeroway"="airstrip"]',
      ],
    ],
  },
  {
    id: "shops",
    queries: [[
      'node["amenity"="marketplace"]',
      'way["amenity"="marketplace"]',
      'node["shop"="supermarket"]',
      'node["shop"="convenience"]',
      'node["shop"="mall"]',
      'node["shop"="general"]',
    ]],
  },
];

async function loadGroup(lat: number, lng: number, spec: (typeof groupQueries)[number]): Promise<NearbyGroup> {
  const meta = nearbyGroupMeta.find((item) => item.id === spec.id) || nearbyGroupMeta[0];
  const results = await Promise.all(spec.queries.map((clauses) => overpassClauses(lat, lng, clauses)));
  const elements = results.flatMap((item) => item || []);
  const failed = results.every((item) => item === null);
  return {
    id: spec.id,
    label: meta.label,
    empty: meta.empty,
    status: !elements.length && failed ? "failed" : "ok",
    places: toPlaces(elements, lat, lng),
  };
}

export async function nearbyPlaces(lat: number, lng: number): Promise<NearbyReport> {
  if (!inGuyana(lat, lng)) return outsideGuyanaReport();
  const key = cacheKey(lat, lng);
  const cached = readEntry(key);
  if (cached) return cached.report;
  const groups = await Promise.all(groupQueries.map((spec) => loadGroup(lat, lng, spec)));
  const report = { groups };
  const failed = groups.some((group) => group.status === "failed");
  writeCache(key, report, failed ? failureTtl : successTtl);
  return report;
}
