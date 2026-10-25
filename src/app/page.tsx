import type { Metadata } from "next";
import { MarketHome } from "../components/MarketHome";
import { areas } from "../lib/areas";
import { loadCatalog, loadPublicAgents } from "../lib/catalog";
import { cardsFromCatalog } from "../lib/market";
import { withCanonical } from "../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withCanonical("/", {
  title: "Guyana Keys",
  description: "One place to find, rent, and list property in Guyana, at home or from abroad. Free to list, no limits.",
});

export default async function HomePage() {
  const [{ listings }, agents] = await Promise.all([loadCatalog(), loadPublicAgents()]);
  const liveByRegion: Record<string, number> = {};
  for (const listing of listings) {
    if (listing.status === "hidden") continue;
    const region = listing.region || areas.find((area) => area.name.toLowerCase() === listing.area.trim().toLowerCase())?.region || "";
    if (!region) continue;
    liveByRegion[region] = (liveByRegion[region] || 0) + 1;
  }
  return <MarketHome cards={cardsFromCatalog(listings, agents)} liveByRegion={liveByRegion} />;
}
