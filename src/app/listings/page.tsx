import Link from "next/link";
import { ListingCard } from "../../components/ListingCard";
import { MapView } from "../../components/MapView";
import { listings } from "../../lib/data";
import { areas } from "../../lib/areas";
export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ q?: string; purpose?: string; type?: string; view?: string }> }) {
  const params = await searchParams;
  const q = (params.q || "").toLowerCase();
  const shown = listings.filter((item) => {
    if (q && !`${item.title} ${item.area} ${item.region}`.toLowerCase().includes(q)) return false;
    if (params.purpose && item.purpose !== params.purpose) return false;
    if (params.type && item.type !== params.type) return false;
    return true;
  });
  const map = params.view === "map";
  const next = new URLSearchParams();
  if (params.q) next.set("q", params.q);
  if (params.purpose) next.set("purpose", params.purpose);
  if (params.type) next.set("type", params.type);
  next.set("view", map ? "list" : "map");
  return (
    <main className="wrap section">
      <h1>{shown.length} homes</h1>
      <form className="search-card" action="/listings">
        <input name="q" list="areas" defaultValue={params.q || ""} placeholder="Neighbourhood, city, or region" />
        <datalist id="areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
        <select name="purpose" defaultValue={params.purpose || "Sale"}><option>Sale</option><option>Rent</option></select>
        <select name="type" defaultValue={params.type || "House"}><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select>
        <button className="btn">Search</button>
      </form>
      <p><Link className="btn ghost" href={`/listings?${next.toString()}`}>{map ? "List" : "Map"}</Link></p>
      {map ? <MapView listings={shown} /> : <div className="grid">{shown.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
    </main>
  );
}
