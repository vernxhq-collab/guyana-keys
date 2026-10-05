import Link from "next/link";
import { listings, money, usd } from "../../lib/data";

export default function ListingsPage() {
  return (
    <main className="wrap">
      <h1>Listings</h1>
      <p>Sample inventory. Real photos come next.</p>
      {listings.map((listing) => (
        <p key={listing.id}>
          <Link href={`/listings/${listing.id}`}>{listing.title}</Link>
          {" · "}{money(listing.priceGyd, listing.purpose)}{" · about USD "}{usd(listing.priceGyd).toLocaleString()}{" · "}{listing.area}
        </p>
      ))}
    </main>
  );
}
