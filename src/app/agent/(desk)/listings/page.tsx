"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";
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
  if (!rows) return <DeskSkeleton count={3} />;

  const hidden = rows.filter((row) => row.status !== "live").length;
  const featured = rows.filter((row) => row.featured).length;
  const full = meta.live >= meta.cap;
  const nextLine = full
    ? "The live cap is full. Upgrade on Plan, or hide a listing."
    : rows.length === 0
      ? "Add the first listing."
      : "Open a listing, or add another.";

  return (
    <div className="stack">
      <p className="eyebrow">Listings</p>
      <h1>Listings</h1>
      <p className="quiet">Hidden listings stay here and do not count toward the cap. Featuring is arranged on Plan.</p>
      <div className="stats">
        <article className="stat"><p className="quiet">Live</p><strong>{meta.live} / {meta.cap}</strong><p className="quiet">{full ? "Cap reached" : `${meta.cap - meta.live} still open`}</p></article>
        <article className="stat"><p className="quiet">Hidden</p><strong>{hidden}</strong><p className="quiet">{hidden ? "Off the public site" : "None hidden"}</p></article>
        <article className="stat"><p className="quiet">Featured</p><strong>{featured}</strong><p className="quiet">{featured ? "Arranged with the admin" : "None featured"}</p></article>
      </div>
      <p className="ai-bar next"><span>{nextLine}</span></p>
      <a className="btn" href="/agent/listings/new">New listing</a>
      {rows.length === 0 ? <p>No listing yet.</p> : rows.map((row) => {
        const sale = row.purpose === "Rent" ? "Rent" : "Sale";
        const status = row.status === "live" ? "Live" : "Hidden";
        const enquiries = `${row.enquiries} ${row.enquiries === 1 ? "enquiry" : "enquiries"}`;
        return (
          <a className="quiet-row agent-listing" key={row.id} href={`/agent/listings/${row.id}`}>
            <img src={row.image} alt="" />
            <span>
              <strong>{row.title}</strong>
              <span className="quiet">{row.area} · {sale} · {money(row.priceGyd, row.purpose)} · {status} · {row.featured ? "Featured" : "Not featured"} · {enquiries}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
