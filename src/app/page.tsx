import Link from "next/link";
import { ListingCard } from "../components/ListingCard";
import { loadCatalog } from "../lib/catalog";
import { areas } from "../lib/areas";
const popular = ["bel-air-park", "ogle", "diamond", "providence", "kitty", "new-amsterdam"];
export const dynamic = "force-dynamic";
export default async function HomePage() {
  const { listings } = await loadCatalog();
  const picks = popular.map((slug) => areas.find((area) => area.slug === slug)).filter((area) => area !== undefined);
  return (
    <main>
      <section className="hero"><div className="wrap hero-inner">
        <h1>Your property search just got serious.</h1>
        <form className="search-panel" action="/listings">
          <div className="tabs">
            <label><input type="radio" name="purpose" value="Sale" defaultChecked /> Buy</label>
            <label><input type="radio" name="purpose" value="Rent" /> Rent</label>
          </div>
          <label className="ask"><span aria-hidden="true">✦</span><input name="q" list="areas" placeholder="3 bed house in Bel Air under 95 million" /></label>
          <datalist id="areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
          <div className="row"><select name="type" defaultValue="House"><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select><button className="btn">Search</button></div>
        </form>
      </div></section>
      <section className="section wrap"><div style={{display:"flex", justifyContent:"space-between"}}><h2>Latest homes</h2><Link href="/listings">Map view</Link></div><div className="grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div></section>
      <section className="section wrap"><div style={{display:"flex", justifyContent:"space-between"}}><h2>Popular neighbourhoods</h2><Link href="/areas">All neighbourhoods</Link></div><div className="grid">{picks.map((area) => <Link className="card" key={area.slug} href={`/areas/${area.slug}`}><div className="card-body"><strong>{area.name}</strong><p className="meta">{area.region}</p></div></Link>)}</div></section>
      <section className="section wrap"><div className="alert-band"><div><h2>Set up a property alert</h2><p className="sub">Stay ahead of a new listing in Bel Air, Ogle, or Diamond. The email arrives when a home is added in the area you choose.</p><Link className="btn" href="/alerts">Create alert</Link></div><img className="alert-photo" src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80" alt="" /></div></section>
    </main>
  );
}
