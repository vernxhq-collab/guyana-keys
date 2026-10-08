"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { listingById, money, usd, agentById, listings } from "../../../lib/data";
import { ListingCard } from "../../../components/ListingCard";
import { readMine, writeMine } from "../../../lib/mine";

type User = { id: string; name: string; email: string };

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listing = listingById(id);
  const [sent, setSent] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth").then((res) => res.json()).then((data) => {
      setUser(data.user || null);
      if (!data.user || !listing) return;
      setSaved(readMine(data.user.id).saved.includes(listing.id));
    });
  }, [listing]);

  if (!listing) return <main className="wrap section"><h1>Listing not found</h1></main>;
  const agent = agentById(listing.agentId);
  const wa = `https://wa.me/${agent.phone}?text=${encodeURIComponent("Hello " + agent.name + ", I saw " + listing.title + " on Guyana Keys.")}`;
  const similar = listings.filter((item) => item.id !== listing.id && item.area === listing.area);

  function toggleSave() {
    if (!user) return;
    const mine = readMine(user.id);
    const next = saved ? mine.saved.filter((item) => item !== listing.id) : [...mine.saved, listing.id];
    writeMine(user.id, { ...mine, saved: next });
    setSaved(!saved);
  }

  async function sendEnquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setSent("Sign in first, so this enquiry stays in Your homes.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: listing.id, note: data.get("note") }),
    });
    const mine = readMine(user.id);
    if (!mine.enquired.includes(listing.id)) writeMine(user.id, { ...mine, enquired: [...mine.enquired, listing.id] });
    setSent(res.ok ? "Enquiry saved in Your homes, and sent for the agent." : "Saved in Your homes. The agent copy could not be sent yet.");
  }

  return (
    <main className="wrap section">
      <img src={listing.image} alt={listing.title} style={{width:"100%", maxHeight:480, objectFit:"cover", borderRadius:16}} />
      <div className="split">
        <div>
          <p className="chip">{listing.purpose === "Sale" ? "For sale" : "To rent"}</p>
          <h1>{listing.title}</h1>
          <p className="price">{money(listing.priceGyd, listing.purpose)}</p>
          <p className="meta">Guide USD {usd(listing.priceGyd).toLocaleString()} - {listing.area}, {listing.region}</p>
          <p className="facts"><span>{listing.beds || "-"} bed</span><span>{listing.baths || "-"} bath</span><span>{listing.sqft.toLocaleString()} sqft</span></p>
          <p>{listing.description}</p>
          <p className="meta">Ask for the transport or title reference before any deposit.</p>
          {user ? (
            <button className="btn ghost" type="button" onClick={toggleSave}>{saved ? "Saved" : "Save"}</button>
          ) : (
            <Link className="btn ghost" href="/account">Sign in to save</Link>
          )}
        </div>
        <aside className="card"><div className="card-body">
          <p className="chip">Agent</p>
          <h2><Link href={`/agents/${agent.id}`}>{agent.name}</Link></h2>
          <p className="meta">{agent.company} - {agent.areas.join(", ")}</p>
          <a className="btn" href={wa}>WhatsApp {agent.name.split(" ")[0]}</a>
          <form className="search-card" style={{marginTop:12, gridTemplateColumns:"1fr"}} onSubmit={sendEnquiry}>
            <input name="name" required placeholder="Your name" defaultValue={user?.name || ""} />
            <input name="phone" required placeholder="WhatsApp number" />
            <input name="note" placeholder="Buying from abroad?" />
            <button className="btn" type="submit">Send enquiry</button>
          </form>
          {sent ? <p>{sent}</p> : null}
          {!user ? <p className="meta"><Link href="/account">Sign in</Link> so the enquiry appears in Your homes.</p> : null}
        </div></aside>
      </div>
      {similar.length > 0 && <section><h2>More in {listing.area}</h2><div className="grid">{similar.map((item) => <ListingCard key={item.id} listing={item} />)}</div></section>}
    </main>
  );
}
