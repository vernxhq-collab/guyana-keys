import { areaByName, areaBySlug, areaFits, areas, regionIn, regionSlug } from "./areas";
import { parseBuyerSearch } from "./assist";
import { GYD_PER_USD, type Listing } from "./data";

export type SearchQuery = {
  q?: string;
  purpose?: string;
  type?: string;
  beds?: string;
  region?: string;
  area?: string;
  sort?: string;
  budget?: string;
  min?: string;
  max?: string;
  currency?: string;
  generator?: string;
  waterTank?: string;
  parking?: string;
};

const queryKeys = ["q", "purpose", "type", "beds", "region", "area", "sort", "budget", "min", "max", "currency", "generator", "waterTank", "parking"] as const;

export function listingsPath(params: SearchQuery) {
  const search = new URLSearchParams();
  for (const key of queryKeys) {
    const value = String(params[key] || "").trim();
    if (value) search.set(key, value);
  }
  const text = search.toString();
  return text ? `/listings?${text}` : "/listings";
}

function amount(value: string | undefined) {
  const number = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function priceBoundsGyd(params: SearchQuery) {
  const currency = params.currency === "usd" ? "usd" : "gyd";
  const toGyd = (value: number) => currency === "usd" ? Math.round(value * GYD_PER_USD) : Math.round(value);
  const min = amount(params.min);
  const max = amount(params.max) || (currency === "gyd" ? amount(params.budget) : 0);
  return {
    currency,
    minGyd: min ? toGyd(min) : 0,
    maxGyd: max ? toGyd(max) : 0,
  };
}

export function searchFormState(params: SearchQuery) {
  const currency = params.currency === "usd" ? "usd" : "gyd";
  const max = String(params.max || "").trim() || (currency === "gyd" ? String(params.budget || "").trim() : "");
  return {
    ...params,
    currency,
    min: String(params.min || "").trim(),
    max,
    beds: params.beds && params.beds !== "0" ? params.beds : "",
  };
}

function chosenArea(params: SearchQuery, text: string) {
  const fromSlug = params.area ? areaBySlug(params.area) : null;
  if (fromSlug) return fromSlug;
  const fromName = params.area ? areaByName(params.area) : null;
  if (fromName) return fromName;
  const parsed = parseBuyerSearch(text);
  if (parsed.area) return areaByName(parsed.area);
  return null;
}

export function filterListings(listings: Listing[], params: SearchQuery) {
  const text = (params.q || "").trim();
  const parsed = parseBuyerSearch(text);
  const landSearch = params.purpose === "Land";
  const purpose = landSearch ? "" : (params.purpose || parsed.purpose);
  const type = landSearch ? "Land" : (params.type !== undefined && params.type !== "" ? params.type : "");
  const typeFromText = !type && !params.type ? (/\bland|lot\b/i.test(text) ? "Land" : /\bapartment|flat\b/i.test(text) ? "Apartment" : /\boffice|commercial|shop\b/i.test(text) ? "Commercial" : /\bhouse\b/i.test(text) ? "House" : "") : "";
  const wantedType = type || typeFromText;
  const beds = params.beds && params.beds !== "0" ? Number(params.beds) : parsed.beds;
  const regions = Array.from(new Set(areas.map((area) => area.region)));
  const regionName = regions.find((item) => regionSlug(item) === params.region) || "";
  const region = regionName || (parsed.area ? "" : regionIn(text));
  const area = chosenArea(params, text);
  const bounds = priceBoundsGyd(params);
  const shown = listings.filter((item) => {
    if (purpose && item.purpose !== purpose) return false;
    if (wantedType && item.type !== wantedType) return false;
    if (beds && item.beds < beds) return false;
    if (parsed.maxPrice && item.priceGyd > parsed.maxPrice) return false;
    if (bounds.minGyd && item.priceGyd < bounds.minGyd) return false;
    if (bounds.maxGyd && item.priceGyd > bounds.maxGyd) return false;
    if (area && !areaFits(item.area, area.name) && item.area !== area.name) return false;
    if (!area && parsed.area && !areaFits(item.area, parsed.area)) return false;
    if (region && item.region !== region) return false;
    if (params.generator && item.site?.generator !== params.generator) return false;
    if (params.waterTank && item.site?.waterTank !== params.waterTank) return false;
    if (params.parking && item.site?.parking !== params.parking) return false;
    const structured = Boolean(parsed.purpose || parsed.area || parsed.beds || parsed.maxPrice || region || area || params.generator || params.waterTank || params.parking);
    if (text && !structured && !`${item.title} ${item.area} ${item.region}`.toLowerCase().includes(text.toLowerCase())) return false;
    return true;
  }).sort((a, b) => params.sort === "price-asc" ? a.priceGyd - b.priceGyd : b.priceGyd - a.priceGyd);
  return { shown, purpose, type: wantedType, region, area };
}
