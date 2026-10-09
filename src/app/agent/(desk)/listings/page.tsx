"use client";

import { useEffect, useState } from "react";
import { money } from "../../../../lib/data";

type Row = { id: string; title: string; area: string; purpose: string; priceGyd: number; status?: string; featured?: boolean; image: string; enquiries: number };

export default function AgentListingsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meta, setMeta] = useState({ live: 0, cap: 3 });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agent?part=listings")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) setError(data.error || "Could not load listings.");
        else {
          setRows(data.listings || []);
          setMeta({ live: data.live || 0, cap: data.cap || 3 });
        }
      })
      .catch(() => setError("Could not load listings."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!rows) return <p>Loading listings...</p>;
  return (
    <div className="stack">
      <h1>Listings</h1>
      <p className="quiet">{meta.live} of {meta.cap} live. Hidden listings stay here and do not count toward the cap.</p>
      <a className="btn" href="/agent/listings/new">New listing</a>
      {rows.length === 0 ? <p>No listing yet. Press New listing.</p> : <div className="list-row quiet" aria-hidden="true"><span></span><span>Title</span><span>Area</span><span>Sale or rent</span><span>Price</span><span>Status</span><span>Featured</span><span>Enquiries</span></div>}
      {rows.map((row) => (
        <a className="list-row" key={row.id} href={`/agent/listings/${row.id}`}>
          <img src={row.image} alt="" />
          <strong>{row.title}</strong>
          <span>{row.area}</span>
          <span>{row.purpose === "Rent" ? "Rent" : "Sale"}</span>
          <span>{money(row.priceGyd, row.purpose)}</span>
          <span>{row.status === "live" ? "Live" : "Hidden"}</span>
          <span>{row.featured ? "Featured" : "Not featured"}</span>
          <span>{row.enquiries}</span>
        </a>
      ))}
    </div>
  );
}
