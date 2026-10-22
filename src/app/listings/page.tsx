import Link from "next/link";
import { ComingSoon } from "../../components/ComingSoon";
import { ListingCard } from "../../components/ListingCard";
import { MapView } from "../../components/MapView";
import { parseBuyerSearch } from "../../lib/assist";
import { loadCatalog } from "../../lib/catalog";
import { areaFits, areas, regionIn, regionSlug } from "../../lib/areas";
import { searchPlaceholder } from "../../lib/search";

function typeFromQuery(text: string) {
  if (/\bland|lot\b/i.test(text)) return "Land";
  if (/\bapartment|flat\b/i.test(text)) return "Apartment";
  if (/\boffice|commercial|shop\b/i.test(text)) return "Commercial";
  if (/\bhouse\b/i.test(text)) return "House";
  return "";
}

export const dynamic = "force-dynamic";

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ q?: string; purpose?: string; type?: string; beds?: string; sort?: string; region?: string; budget?: string }> }) {
  const params = await searchParams;
  const { listings } = await loadCatalog();
  const text = (params.q || "").trim();
  const parsed = parseBuyerSearch(text);
  const landSearch = params.purpose === "Land";
  const purpose = landSearch ? "" : (params.purpose || parsed.purpose);
  const type = landSearch ? "Land" : (params.type !== undefined ? params.type : typeFromQuery(text));
  const beds = params.beds && params.beds !== "0" ? Number(params.beds) : parsed.beds;
  const budget = Number(params.budget || 0);
  const regions = Array.from(new Set(areas.map((area) => area.region)));
  const regionName = regions.find((item) => regionSlug(item) === params.region) || "";
  const region = regionName || (parsed.area ? "" : regionIn(text));
  const shown = listings.filter((item) => {
    if (purpose && item.purpose !== purpose) return false;
    if (type && item.type !== type) return false;
    if (beds && item.beds < beds) return false;
    if (parsed.maxPrice && item.priceGyd > parsed.maxPrice) return false;
    if (budget > 0 && item.priceGyd > budget) return false;
    if (parsed.area && !areaFits(item.area, parsed.area)) return false;
    if (region && item.region !== region) return false;
    const structured = Boolean(parsed.purpose || parsed.area || parsed.beds || parsed.maxPrice || region);
    if (text && !structured && !`${item.title} ${item.area} ${item.region}`.toLowerCase().includes(text.toLowerCase())) return false;
    return true;
  }).sort((a, b) => params.sort === "price-asc" ? a.priceGyd - b.priceGyd : b.priceGyd - a.priceGyd);
  return (
    <main className="wrap section">
      <form className="search-panel plain" action="/listings">
        <label className="ask"><input name="q" list="areas" defaultValue={params.q || ""} placeholder={searchPlaceholder} /></label>
        <datalist id="areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
        <div className="filter-row">
          <select name="purpose" defaultValue={params.purpose || ""} aria-label="Buy or rent"><option value="">Buy or rent</option><option value="Sale">Buy</option><option value="Rent">Rent</option></select>
          <select name="type" defaultValue={params.type ?? ""} aria-label="Type"><option value="">Any</option><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select>
          <select name="beds" defaultValue={params.beds || "0"} aria-label="Beds"><option value="0">Any beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option></select>
          <select name="region" defaultValue={params.region || ""} aria-label="Region"><option value="">Any region</option>{regions.map((item) => <option key={item} value={regionSlug(item)}>{item}</option>)}</select>
          <select name="sort" defaultValue={params.sort || "price-desc"} aria-label="Sort"><option value="price-desc">Highest price</option><option value="price-asc">Lowest price</option></select>
          <button className="btn">Search</button>
        </div>
      </form>
      {listings.length === 0 ? <ComingSoon /> : (
        <>
          <p className="sub">{shown.length} homes · Listed on Guyana Keys · GYD with a USD guide · not proof of title · <Link href="/listings">Clear</Link></p>
          <div className="split">{shown.length === 0 ? <p>No home matches. Try a neighbourhood, or clear a filter.</p> : <div className="grid">{shown.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}<MapView listings={shown} /></div>
        </>
      )}
    </main>
  );
}
