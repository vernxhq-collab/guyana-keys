import Link from "next/link";
import { money, usd, type Listing } from "../lib/data";
export function ListingCard({ listing }: { listing: Listing }) {
  const land = listing.type === "Land";
  return (
    <Link className="card" href={`/listings/${listing.id}`}>
      <img src={listing.image} alt="" />
      <div className="card-body">
        <span className="chip">{listing.purpose === "Sale" ? "For sale" : "To rent"}</span><span className="chip">{listing.type}</span>
        <p className="price">{money(listing.priceGyd, listing.purpose)}</p>
        <p className="meta">Guide USD {usd(listing.priceGyd).toLocaleString()}</p>
        <strong>{listing.area}</strong>
        <p className="meta">{listing.title}</p>
        <div className="facts">{land ? <span>{listing.sqft.toLocaleString()} sqft</span> : <><span>{listing.beds} bed</span><span>{listing.baths} bath</span><span>{listing.sqft.toLocaleString()} sqft</span></>}</div>
      </div>
    </Link>
  );
}
