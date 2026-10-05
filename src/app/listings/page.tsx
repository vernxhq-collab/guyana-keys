"use client";
import { useMemo, useState } from "react";
import { listings } from "../../lib/data";
import { ListingCard } from "../../components/ListingCard";
import { MapView } from "../../components/MapView";
export default function ListingsPage() {
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState("All");
  const [type, setType] = useState("All");
  const [view, setView] = useState("grid");
  const shown = useMemo(() => listings.filter((item) => {
    if (q && !`${item.title} ${item.area}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (purpose !== "All" && item.purpose !== purpose) return false;
    if (type !== "All" && item.type !== type) return false;
    return true;
  }), [q, purpose, type]);
  return (
    <main className="wrap section">
      <h1>Listings</h1>
      <form className="search" onSubmit={(e)=>e.preventDefault()}>
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Area or title" />
        <select value={purpose} onChange={(e)=>setPurpose(e.target.value)}><option>All</option><option>Sale</option><option>Rent</option></select>
        <select value={type} onChange={(e)=>setType(e.target.value)}><option>All</option><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select>
        <button className="btn ghost" type="button" onClick={()=>setView(view==="grid"?"map":"grid")}>{view==="grid"?"Map":"List"}</button>
      </form>
      {view==="map" ? <MapView listings={shown} /> : <div className="grid">{shown.map((listing)=><ListingCard key={listing.id} listing={listing} />)}</div>}
    </main>
  );
}
