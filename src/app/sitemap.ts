import type { MetadataRoute } from "next";
import { areas, regionSlug } from "../lib/areas";
import { loadCatalog, loadPublicAgents, sampleDataEnabled } from "../lib/catalog";
import { publicOrigin } from "../lib/seo";

const pages = [
  "/",
  "/listings",
  "/about",
  "/contact",
  "/agents",
  "/agents/apply",
  "/areas",
  "/tools",
  "/guides",
  "/guides/buying-from-abroad",
  "/guides/spotting-scams",
  "/guides/renting",
  "/alerts",
  "/advertise",
  "/advertise/listing",
  "/landlords",
  "/developers",
  "/partners",
  "/privacy",
  "/terms",
  "/credits",
];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = publicOrigin;
  const lastModified = new Date();
  const regions = [...new Set(areas.map((area) => area.region))].map((name) => `/areas/region/${regionSlug(name)}`);
  const neighbourhoods = areas.map((area) => `/areas/${area.slug}`);
  const catalog = await loadCatalog();
  const agents = await loadPublicAgents();
  const listings = catalog.source === "db" ? catalog.listings.map((item) => `/listings/${item.id}`) : [];
  const people = sampleDataEnabled() ? [] : agents.map((agent) => `/agents/${agent.id}`);
  return [...pages, ...regions, ...neighbourhoods, ...listings, ...people].map((path) => ({
    url: path === "/" ? `${site}/` : `${site}${path}`,
    lastModified,
  }));
}
