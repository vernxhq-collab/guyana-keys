import Link from "next/link";
import { money, usd, type Listing } from "../lib/data";

export function ListingCard({ listing }: { listing: Listing }) {
  const photos = listing.photos?.length || (listing.image ? 1 : 0);
  const land = listing.type === "Land";
  return (
    <Link className="card" href={`/listings/${listing.id}`}>
      <div className="card-photo">
        <img src={listing.image} alt="" />
        <span className="photo-tag">{listing.purpose === "Sale" ? "For sale" : "For rent"}</span>
        {photos > 0 ? <span className="photo-count">{photos} {photos === 1 ? "photo" : "photos"}</span> : null}
      </div>
      <div className="card-body">
        <p className="price">{money(listing.priceGyd, listing.purpose)}</p>
        <p className="meta">Guide USD {usd(listing.priceGyd).toLocaleString()}</p>
        <strong>{listing.title}</strong>
        <p className="meta">{listing.area}</p>
        <p className="facts">{land ? <span>{listing.sqft.toLocaleString()} sqft</span> : <><span>{listing.beds} bed</span><span>{listing.baths} bath</span></>}</p>
      </div>
    </Link>
  );
}
