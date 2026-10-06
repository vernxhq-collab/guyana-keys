import Link from "next/link";
import { ListingCard } from "../components/ListingCard";
import { listings } from "../lib/data";
import { areas } from "../lib/areas";
export default function HomePage() {
  return (
    <main>
      <section className="hero"><div className="wrap hero-inner">
        <h1>Your property search just got serious.</h1>
        <form className="search-panel" action="/listings">
          <div className="tabs"><span>Buy</span><span>Rent</span></div>
          <label className="ask"><span aria-hidden="true">✦</span><input name="q" list="areas" placeholder="3 bed house in Bel Air under 95 million" /></label>
          <datalist id="areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
          <div className="row"><select name="purpose" defaultValue="Sale"><option>Sale</option><option>Rent</option></select><select name="type" defaultValue="House"><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select><button className="btn">Search</button></div>
        </form>
      </div></section>
      <section className="section wrap"><div style={{display:"flex", justifyContent:"space-between"}}><h2>Latest homes</h2><Link href="/listings">Map view</Link></div><div className="grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div></section>
      <section className="section wrap"><h2>Neighbourhoods</h2><div className="grid">{areas.slice(0, 6).map((area) => <Link className="card" key={area.slug} href={`/areas/${area.slug}`}><div className="card-body"><strong>{area.name}</strong><p className="meta">{area.region}</p></div></Link>)}</div></section>
    </main>
  );
}
