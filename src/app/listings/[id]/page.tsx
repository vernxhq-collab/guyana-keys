"use client";
import { use, useState } from "react";
import { listingById, money, usd, agentById } from "../../../lib/data";
export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listing = listingById(id);
  const [sent, setSent] = useState("");
  if (!listing) return <main className="wrap section"><h1>Listing not found</h1></main>;
  const agent = agentById(listing.agentId);
  const wa = `https://wa.me/${agent.phone}?text=${encodeURIComponent("Hello " + agent.name + ", I saw " + listing.title + " on Guyana Keys.")}`;
  return (
    <main className="wrap section">
      <img src={listing.image} alt={listing.title} style={{width:"100%", maxHeight:460, objectFit:"cover", borderRadius:16}} />
      <h1>{listing.title}</h1>
      <p className="price">{money(listing.priceGyd, listing.purpose)}</p>
      <p className="meta">About USD {usd(listing.priceGyd).toLocaleString()} · {listing.area}</p>
      <p>{listing.description}</p>
      <a className="btn" href={wa}>WhatsApp {agent.name}</a>
      <form className="search-card" style={{marginTop:16}} onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: listing.id, note: data.get("note") }) }); const body = await res.json(); setSent(res.ok ? "Enquiry saved." : body.error); }}>
        <input name="name" required placeholder="Your name" /><input name="phone" required placeholder="WhatsApp number" /><input name="note" placeholder="When can you view?" /><button className="btn" type="submit">Send enquiry</button>
      </form>
      {sent && <p>{sent}</p>}
    </main>
  );
}
