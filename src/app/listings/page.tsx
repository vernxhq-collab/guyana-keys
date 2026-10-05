import { ListingCard } from "../../components/ListingCard";
import { MapView } from "../../components/MapView";
import { listings } from "../../lib/data";
import { areas } from "../../lib/areas";
export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ q?: string; purpose?: string; type?: string }> }) {
  const params = await searchParams;
  const q = (params.q || "").toLowerCase();
  const shown = listings.filter((item) => {
    if (q && !`${item.title} ${item.area} ${item.region}`.toLowerCase().includes(q)) return false;
    if (params.purpose && item.purpose !== params.purpose) return false;
    if (params.type && item.type !== params.type) return false;
    return true;
  });
  return (
    <main className="wrap section">
      <form className="search-card" action="/listings">
        <input name="q" list="areas" defaultValue={params.q || ""} placeholder="Neighbourhood, city, or region" />
        <datalist id="areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
        <select name="purpose" defaultValue={params.purpose || "Sale"}><option>Sale</option><option>Rent</option></select>
        <select name="type" defaultValue={params.type || "House"}><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select>
        <button className="btn">Search</button>
      </form>
      <p className="sub">{shown.length} homes · GYD with a USD guide · a listing is not proof of title</p>
      <div className="split">{shown.length === 0 ? <p>No listing matches.</p> : <div className="grid">{shown.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}<MapView listings={shown} /></div>
    </main>
  );
}
