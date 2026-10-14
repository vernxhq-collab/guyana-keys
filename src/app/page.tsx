import Link from "next/link";
import { ListingCard } from "../components/ListingCard";
import { loadCatalog } from "../lib/catalog";
import { areas } from "../lib/areas";

const popular = ["bel-air-park", "ogle", "diamond", "providence", "kitty", "new-amsterdam"];
const hero = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=2000&q=80";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { listings } = await loadCatalog();
  const picks = popular.map((slug) => areas.find((area) => area.slug === slug)).filter((area) => area !== undefined);
  return (
    <main>
      <section className="hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(7,28,20,.42), rgba(7,28,20,.28)), url(${hero})` }}>
        <div className="wrap hero-inner">
          <h1>Find property in Guyana.</h1>
          <p className="hero-line">Search by neighbourhood, or describe the home you want.</p>
          <form className="search-panel" action="/listings">
            <div className="tabs">
              <label><input type="radio" name="purpose" value="Sale" defaultChecked /> Buy</label>
              <label><input type="radio" name="purpose" value="Rent" /> Rent</label>
            </div>
            <label className="ask"><input name="q" list="areas" placeholder="Bel Air, or 3 bed house under 95 million" /></label>
            <datalist id="areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
            <div className="filter-row">
              <select name="type" defaultValue="" aria-label="Type"><option value="">Any type</option><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select>
              <select name="beds" defaultValue="0" aria-label="Beds"><option value="0">Any beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option></select>
              <button className="btn">Search</button>
            </div>
          </form>
        </div>
      </section>
      <section className="section wrap">
        <h2>Homes available now</h2>
        <div className="grid">{listings.slice(0, 6).map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
        <p className="home-actions"><Link className="btn" href="/listings">Browse all homes</Link></p>
      </section>
      <section className="section wrap">
        <div className="section-head"><h2>Neighbourhoods</h2><Link href="/areas">All neighbourhoods</Link></div>
        <div className="grid">{picks.map((area) => <Link className="card" key={area.slug} href={`/areas/${area.slug}`}><div className="card-body"><strong>{area.name}</strong><p className="meta">{area.region}</p></div></Link>)}</div>
      </section>
      <section className="section wrap home-actions">
        <div>
          <h2>Hear about a new listing</h2>
          <p className="sub">An email when a home is added in the area you choose.</p>
          <Link className="btn" href="/alerts">Create alert</Link>
        </div>
      </section>
    </main>
  );
}
