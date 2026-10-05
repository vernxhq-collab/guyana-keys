import Link from "next/link";
import { money, usd, type Listing } from "../lib/data";
export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link className="card" href={`/listings/${listing.id}`}>
      <img src={listing.image} alt="" />
      <div className="card-body">
        <span className="chip">{listing.purpose === "Sale" ? "For sale" : "To rent"}</span><span className="chip">{listing.type}</span>
        <p className="price">{money(listing.priceGyd, listing.purpose)}</p>
        <p className="meta">About USD {usd(listing.priceGyd).toLocaleString()}</p>
        <strong>{listing.title}</strong>
        <p className="meta">{listing.area} · {listing.beds ? listing.beds + " bed · " + listing.baths + " bath" : listing.type}</p>
      </div>
    </Link>
  );
}
