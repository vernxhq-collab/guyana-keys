import Link from "next/link";
import { ListingCard } from "../components/ListingCard";
import { listings } from "../lib/data";
import { areas } from "../lib/areas";
export default function HomePage() {
  return (
    <main>
      <section className="hero"><div className="wrap">
        <h1>Find a home in Guyana.</h1>
        <p>Houses, land, and rentals. Prices in GYD and USD. Message the agent on WhatsApp.</p>
        <form className="search-card" action="/listings"><input name="q" placeholder="Bel Air, Diamond, Ogle, Vreed-en-Hoop" /><select name="purpose" defaultValue="Sale"><option>Sale</option><option>Rent</option></select><select name="type" defaultValue="House"><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select><button className="btn">Search</button></form>
      </div></section>
      <section className="section wrap"><h2>For sale</h2><div className="grid">{listings.filter((item)=>item.purpose==="Sale").map((listing)=><ListingCard key={listing.id} listing={listing} />)}</div><p><Link href="/listings">See all listings</Link></p></section>
      <section className="section wrap"><h2>Neighbourhoods</h2><div className="grid">{areas.slice(0,6).map((area)=><Link className="card" key={area.slug} href={`/areas/${area.slug}`}><div className="card-body"><strong>{area.name}</strong><p className="meta">{area.region}</p></div></Link>)}</div></section>
    </main>
  );
}
