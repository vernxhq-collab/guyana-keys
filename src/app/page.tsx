import Link from "next/link";
import { ListingCard } from "../components/ListingCard";
import { listings } from "../lib/data";
import { areas } from "../lib/areas";
export default function HomePage() {
  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <p className="kicker">Built for Guyana</p>
          <h1>Find a real listing, not a Facebook post.</h1>
          <p className="lede">Homes, land, and rentals across Georgetown, the coast, and Berbice. Prices in GYD and USD. WhatsApp the agent from the listing.</p>
          <form className="search" action="/listings"><input name="q" placeholder="Bel Air, Ogle, Providence" /><button className="btn" type="submit">Search</button></form>
        </div>
        <div className="hero-card"><div><p className="kicker" style={{color:"#f6edd8"}}>Georgetown</p><h2>Verified homes. Named agents. A map.</h2></div></div>
      </section>
      <section className="section"><h2>Featured</h2><div className="grid">{listings.filter((item)=>item.featured).map((listing)=><ListingCard key={listing.id} listing={listing} />)}</div></section>
      <section className="section"><h2>Neighbourhoods</h2><div className="grid">{areas.slice(0,6).map((area)=><article className="card" key={area.slug}><div className="card-body"><h2><Link href={`/areas/${area.slug}`}>{area.name}</Link></h2><p className="meta">{area.note}</p></div></article>)}</div></section>
    </main>
  );
}
