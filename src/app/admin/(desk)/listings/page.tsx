"use client";

import { useEffect, useState } from "react";

type Row = { id: string; title: string; area: string; agentName: string; status?: string; featured?: boolean; featurePaid: boolean };

export default function AdminListingsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  function load(query = q) {
    return fetch(`/api/admin?part=listings&q=${encodeURIComponent(query)}`).then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load listings.");
      else setRows(data.listings || []);
    }).catch(() => setError("Could not load listings."));
  }
  useEffect(() => { void load(""); }, []);

  async function act(body: Record<string, unknown>) {
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setNote(res.ok ? "Saved." : data.error || "That could not be saved.");
    if (res.ok) await load();
  }

  if (error) return <p>{error}</p>;
  if (!rows) return <p>Loading listings...</p>;
  return (
    <div className="stack">
      <h1>Listings</h1>
      <form className="ai-bar" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Area or agent" aria-label="Search by area or agent" />
        <button className="btn" type="submit">Search</button>
      </form>
      {rows.length === 0 ? <p>No listing matches.</p> : rows.map((row) => (
        <article className="panel" key={row.id}>
          <strong>{row.title}</strong>
          <p className="quiet">{row.area} · {row.agentName} · {row.status === "live" ? "Live" : "Hidden"} · {row.featured ? "Featured" : "Not featured"}</p>
          {row.status === "live" ? <button className="btn ghost" type="button" onClick={() => void act({ action: "hide", propertyId: row.id })}>Hide</button> : null}
          {row.featured ? <button className="btn ghost" type="button" onClick={() => void act({ action: "unfeature", propertyId: row.id })}>Unfeature</button> : row.featurePaid ? <button className="btn ghost" type="button" onClick={() => void act({ action: "feature", propertyId: row.id })}>Mark featured</button> : null}
        </article>
      ))}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
