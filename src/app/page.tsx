import type { Metadata } from "next";
import { MarketHome } from "../components/MarketHome";
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
  return <MarketHome cards={cardsFromCatalog(listings, agents)} />;
}
