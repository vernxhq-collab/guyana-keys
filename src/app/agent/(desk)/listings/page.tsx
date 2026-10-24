"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";
import { money } from "../../../../lib/data";

type Row = { id: string; title: string; area: string; purpose: string; priceGyd: number; status?: string; featured?: boolean; image: string; enquiries: number; photos?: string[] };

export default function AgentListingsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meta, setMeta] = useState({ live: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agent?part=listings")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) setError(data.error || "Could not load listings.");
        else {
          setRows(data.listings || []);
          setMeta({ live: data.live || 0 });
        }
      })
      .catch(() => setError("Could not load listings."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!rows) return <DeskSkeleton count={3} />;

  const hidden = rows.filter((row) => row.status !== "live").length;
  const featured = rows.filter((row) => row.featured).length;
  const nextLine = rows.length === 0
    ? "Add the first listing."
    : "Open a listing, or add another. Free to list, no limits.";

  return (
    <div className="stack">
      <p className="eyebrow">Listings</p>
      <h1>Listings</h1>
      <p className="quiet">Free to list, no limits. A live listing needs at least 3 photos and owner permission. Hidden listings stay off the public site.</p>
      <div className="stats">
        <article className="stat"><p className="quiet">Live</p><strong>{meta.live}</strong><p className="quiet">Free to list, no limits</p></article>
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
              <span className="quiet">{row.area} · {sale} · {money(row.priceGyd, row.purpose)} · {status} · {row.featured ? "Featured" : "Not featured"} · {enquiries}{(row.photos?.length || 0) < 3 ? " · Photos missing for a live listing" : ""}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
