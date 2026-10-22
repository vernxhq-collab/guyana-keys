import { MarketHome } from "../components/MarketHome";
import { loadCatalog, loadPublicAgents } from "../lib/catalog";
import { cardsFromCatalog } from "../lib/market";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ listings }, agents] = await Promise.all([loadCatalog(), loadPublicAgents()]);
  return <MarketHome cards={cardsFromCatalog(listings, agents)} />;
}
