import Link from "next/link";
import { ListingCard } from "../../components/ListingCard";
import { MapView } from "../../components/MapView";
import { listings } from "../../lib/data";
import { areas } from "../../lib/areas";

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ q?: string; purpose?: string; type?: string; beds?: string; sort?: string }> }) {
  const params = await searchParams;
  const q = (params.q || "").toLowerCase();
  const beds = Number(params.beds || 0);
  const shown = listings.filter((item) => {
    if (q && !`${item.title} ${item.area} ${item.region}`.toLowerCase().includes(q)) return false;
    if (params.purpose && item.purpose !== params.purpose) return false;
    if (params.type && item.type !== params.type) return false;
    if (beds && item.beds < beds) return false;
    return true;
  }).sort((a, b) => params.sort === "price-asc" ? a.priceGyd - b.priceGyd : b.priceGyd - a.priceGyd);
  return (
    <main className="wrap section">
      <form className="search-card" action="/listings">
        <input name="q" list="areas" defaultValue={params.q || ""} placeholder="Neighbourhood, city, or region" />
        <datalist id="areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
        <select name="purpose" defaultValue={params.purpose || "Sale"}><option>Sale</option><option>Rent</option></select>
        <select name="type" defaultValue={params.type || "House"}><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select>
        <select name="beds" defaultValue={params.beds || "0"}><option value="0">Any beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option></select>
        <select name="sort" defaultValue={params.sort || "price-desc"}><option value="price-desc">Highest price</option><option value="price-asc">Lowest price</option></select>
        <button className="btn">Search</button>
      </form>
      <p className="sub">{shown.length} homes · GYD with a USD guide · not proof of title · <Link href="/listings">Clear</Link></p>
      <div className="split">{shown.length === 0 ? <p>No home matches. Try a neighbourhood, or clear the beds filter.</p> : <div className="grid">{shown.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}<MapView listings={shown} /></div>
    </main>
  );
}
