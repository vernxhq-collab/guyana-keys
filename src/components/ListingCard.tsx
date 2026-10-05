import Link from "next/link";
import { agentById, money, usd, type Listing } from "../lib/data";

export function ListingCard({ listing }: { listing: Listing }) {
  const agent = agentById(listing.agentId);
  return (
    <Link className="card" href={`/listings/${listing.id}`}>
      <strong>{listing.title}</strong>
      <p>{money(listing.priceGyd, listing.purpose)} · {listing.area} · {agent.name}</p>
      <p>About USD {usd(listing.priceGyd).toLocaleString()}</p>
    </Link>
  );
}
