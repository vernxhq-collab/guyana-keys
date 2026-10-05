"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { listings, money, usd } from "../../lib/data";
import { MapView } from "../../components/MapView";

export default function ListingsPage() {
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState("All");
  const [type, setType] = useState("All");
  const [view, setView] = useState("grid");
  const shown = useMemo(() => listings.filter((item) => {
    const text = `${item.title} ${item.area}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (purpose !== "All" && item.purpose !== purpose) return false;
    if (type !== "All" && item.type !== type) return false;
    return true;
  }), [q, purpose, type]);
  return (
    <main className="wrap">
      <h1>Listings</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Bel Air, Ogle, land" />
      <select value={purpose} onChange={(e) => setPurpose(e.target.value)}><option>All</option><option>Sale</option><option>Rent</option></select>
      <select value={type} onChange={(e) => setType(e.target.value)}><option>All</option><option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option></select>
      <button type="button" onClick={() => setView(view === "grid" ? "map" : "grid")}>{view === "grid" ? "Map" : "List"}</button>
      {view === "map" ? <MapView listings={shown} /> : shown.map((item) => (
        <p key={item.id}><Link href={`/listings/${item.id}`}>{item.title}</Link> · {money(item.priceGyd, item.purpose)} · about USD {usd(item.priceGyd).toLocaleString()} · {item.area}</p>
      ))}
    </main>
  );
}
