"use client";
import { use, useState } from "react";
import Link from "next/link";
import { listingById, money, usd, agentById, listings } from "../../../lib/data";
import { ListingCard } from "../../../components/ListingCard";
export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listing = listingById(id);
  const [sent, setSent] = useState("");
  if (!listing) return <main className="wrap section"><h1>Listing not found</h1></main>;
  const agent = agentById(listing.agentId);
  const wa = `https://wa.me/${agent.phone}?text=${encodeURIComponent("Hello " + agent.name + ", I saw " + listing.title + " on Guyana Keys.")}`;
  const similar = listings.filter((item) => item.id !== listing.id && item.area === listing.area);
  return (
    <main className="wrap section">
      <img src={listing.image} alt={listing.title} style={{width:"100%", maxHeight:480, objectFit:"cover", borderRadius:16}} />
      <div className="split">
        <div>
          <p className="chip">{listing.purpose === "Sale" ? "For sale" : "To rent"}</p>
          <h1>{listing.title}</h1>
          <p className="price">{money(listing.priceGyd, listing.purpose)}</p>
          <p className="meta">Guide USD {usd(listing.priceGyd).toLocaleString()} · {listing.area}, {listing.region}</p>
          <p className="facts"><span>{listing.beds || "\u2014"} bed</span><span>{listing.baths || "\u2014"} bath</span><span>{listing.sqft.toLocaleString()} sqft</span></p>
          <p>{listing.description}</p>
          <p className="meta">Ask for the transport or title reference before any deposit.</p>
        </div>
        <aside className="card"><div className="card-body">
          <p className="chip">Agent</p>
          <h2><Link href={`/agents/${agent.id}`}>{agent.name}</Link></h2>
          <p className="meta">{agent.company} · {agent.areas.join(", ")}</p>
          <a className="btn" href={wa}>WhatsApp {agent.name.split(" ")[0]}</a>
          <form className="search-card" style={{marginTop:12, gridTemplateColumns:"1fr"}} onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: listing.id, note: data.get("note") }) }); const body = await res.json(); setSent(res.ok ? "Enquiry saved for the agent." : body.error || "Could not save."); }}>
            <input name="name" required placeholder="Your name" /><input name="phone" required placeholder="WhatsApp number" /><input name="note" placeholder="Buying from abroad?" /><button className="btn" type="submit">Send enquiry</button>
          </form>
          {sent && <p>{sent}</p>}
        </div></aside>
      </div>
      {similar.length > 0 && <section><h2>More in {listing.area}</h2><div className="grid">{similar.map((item) => <ListingCard key={item.id} listing={item} />)}</div></section>}
    </main>
  );
}
