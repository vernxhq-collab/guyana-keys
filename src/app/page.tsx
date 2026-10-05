import Link from "next/link";
import { ListingCard } from "../components/ListingCard";
import { listings } from "../lib/data";
import { areas } from "../lib/areas";
export default function HomePage() {
  return (
    <main>
      <section className="hero"><div className="wrap">
        <h1>Property for sale and rent in Guyana.</h1>
        <p>Search Georgetown, the East Bank, the East Coast, and Berbice. Prices in GYD, with a USD guide.</p>
        <form className="search-card" action="/listings"><input name="q" placeholder="Enter a neighbourhood, city, or region" /><select name="purpose" defaultValue="Sale"><option>Sale</option><option>Rent</option></select><select name="type" defaultValue="House"><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select><button className="btn">Search</button></form>
      </div></section>
      <section className="section wrap"><h2>Latest homes</h2><div className="grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div></section>
      <section className="section wrap" style={{background:"#f3f5f4"}}><h2>Explore neighbourhoods</h2><div className="grid">{areas.slice(0,6).map((area) => <Link className="card" key={area.slug} href={`/areas/${area.slug}`}><div className="card-body"><strong>{area.name}</strong><p className="meta">{area.region}</p><p className="meta">{area.note}</p></div></Link>)}</div><p><Link href="/areas">All neighbourhoods</Link></p></section>
    </main>
  );
}
