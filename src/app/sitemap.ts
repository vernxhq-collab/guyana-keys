import type { MetadataRoute } from "next";
import { areas, regionSlug } from "../lib/areas";
import { siteUrl } from "../lib/contact";

const pages = [
  "/",
  "/listings",
  "/agents",
  "/agents/apply",
  "/areas",
  "/tools",
  "/guides",
  "/alerts",
  "/advertise",
  "/advertise/listing",
  "/landlords",
  "/developers",
  "/partners",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl();
  const lastModified = new Date();
  const regions = [...new Set(areas.map((area) => area.region))].map((name) => `/areas/region/${regionSlug(name)}`);
  const neighbourhoods = areas.map((area) => `/areas/${area.slug}`);
  return [...pages, ...regions, ...neighbourhoods].map((path) => ({
    url: path === "/" ? `${site}/` : `${site}${path}`,
    lastModified,
  }));
}
