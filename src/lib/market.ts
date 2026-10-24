import type { MarketCardData } from "../components/MarketCard";
import type { Agent, Listing } from "./data";

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function cardsFromCatalog(listings: Listing[], agents: Agent[], limit = 6): MarketCardData[] {
  const byId = new Map(agents.map((agent) => [agent.id, agent]));
  const cutoff = Date.now() - NEW_WINDOW_MS;
  return listings.slice(0, limit).map((listing) => {
    const agent = byId.get(listing.agentId);
    const created = listing.createdAt ? Date.parse(listing.createdAt) : Number.NaN;
    return {
      id: listing.id,
      href: `/listings/${listing.id}`,
      title: listing.title,
      area: listing.area,
      purpose: listing.purpose === "Rent" ? "Rent" : "Sale",
      type: listing.type,
      priceGyd: listing.priceGyd,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft,
      agent: agent?.name || undefined,
      founding: agent?.founding === true,
      isNew: Number.isFinite(created) && created >= cutoff,
      reduced: listing.priceReduced === true,
      image: listing.image,
    };
  });
}
