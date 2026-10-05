import Link from "next/link";
import { ListingCard } from "../components/ListingCard";
import { listings, agents } from "../lib/data";
import { areas } from "../lib/areas";
export default function HomePage() {
  return (
    <main>
      <section className="hero"><div className="wrap">
        <h1>Property for sale and rent in Guyana.</h1>
        <p>Search Georgetown, the East Bank, the East Coast, and Berbice.</p>
        <form className="search-card" action="/listings"><input name="q" list="areas" placeholder="Try Bel Air, Ogle, Diamond" /><datalist id="areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist><select name="purpose" defaultValue="Sale"><option>Sale</option><option>Rent</option></select><select name="type" defaultValue="House"><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select><button className="btn">Search</button></form>
      </div></section>
      <section className="section wrap"><div style={{display:"flex", justifyContent:"space-between"}}><h2>Latest homes</h2><Link href="/listings?view=map">Map view</Link></div><div className="grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div></section>
      <section className="section wrap"><h2>Find an agent</h2><div className="grid">{agents.map((agent) => <Link className="card" key={agent.id} href={`/agents/${agent.id}`}><div className="card-body"><strong>{agent.name}</strong><p className="meta">{agent.company}</p><p className="meta">{agent.areas.join(", ")}</p></div></Link>)}</div></section>
    </main>
  );
}
