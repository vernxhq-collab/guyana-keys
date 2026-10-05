import Link from "next/link";
import { agentById, money, usd, type Listing } from "../lib/data";
export function ListingCard({ listing }: { listing: Listing }) {
  const agent = agentById(listing.agentId);
  return (
    <Link className="card" href={`/listings/${listing.id}`}>
      <img src={listing.image} alt={listing.title} />
      <div className="card-body"><span className="chip">{listing.purpose}</span><span className="chip">{listing.type}</span><p className="price">{money(listing.priceGyd, listing.purpose)}</p><p className="meta">About USD {usd(listing.priceGyd).toLocaleString()} · {listing.area}</p><strong>{listing.title}</strong><p className="meta">{listing.beds ? listing.beds + " bed · " : ""}{agent.name}</p></div>
    </Link>
  );
}
