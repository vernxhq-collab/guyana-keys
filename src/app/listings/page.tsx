import Link from "next/link";
import { ListingCard } from "../../components/ListingCard";
import { listings } from "../../lib/data";

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ q?: string; purpose?: string; type?: string }> }) {
  const params = await searchParams;
  const q = (params.q || "").toLowerCase();
  const shown = listings.filter((item) => {
    if (q && !`${item.title} ${item.area}`.toLowerCase().includes(q)) return false;
    if (params.purpose && item.purpose !== params.purpose) return false;
    if (params.type && item.type !== params.type) return false;
    return true;
  });
  const title = params.type === "Land" ? "Land" : params.purpose === "Rent" ? "To rent" : params.purpose === "Sale" ? "For sale" : "All listings";
  return (
    <main className="wrap section">
      <h1>{title}</h1>
      <p className="sub">{shown.length} listings. Prices in GYD and an approximate USD figure.</p>
      <form className="search-card" action="/listings"><input name="q" defaultValue={params.q || ""} placeholder="Area or title" /><select name="purpose" defaultValue={params.purpose || "Sale"}><option>Sale</option><option>Rent</option></select><select name="type" defaultValue={params.type || "House"}><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select><button className="btn">Search</button></form>
      <div className="grid" style={{marginTop:18}}>{shown.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
      {shown.length === 0 && <p>No listing matches. Try another area.</p>}
      <p><Link href="/listings">Clear filters</Link></p>
    </main>
  );
}
