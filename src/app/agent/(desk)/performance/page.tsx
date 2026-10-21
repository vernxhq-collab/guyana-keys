"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";

type Row = { id: string; title: string; status: string; views: number; saves: number; enquiries: number };

export default function PerformancePage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [live, setLive] = useState(0);
  const [hidden, setHidden] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agent?part=performance")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => { if (!ok) setError(data.error || "Could not load performance.");
        else { setRows(data.rows || []); setLive(data.live || 0); setHidden(data.hidden || 0); } })
      .catch(() => setError("Could not load performance."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!rows) return <DeskSkeleton count={3} />;
  const views = rows.reduce((sum, row) => sum + row.views, 0);
  const enquiries = rows.reduce((sum, row) => sum + row.enquiries, 0);

  return (
    <div className="stack">
      <p className="eyebrow">Performance</p>
      <h1>How the homes are doing</h1>
      <p className="quiet">Views and saves are counted on the listing. A number is not a valuation.</p>
      <div className="stats">
        <article className="stat"><p className="quiet">Views</p><strong>{views}</strong></article>
        <article className="stat"><p className="quiet">Live</p><strong>{live}</strong></article>
        <article className="stat"><p className="quiet">Hidden</p><strong>{hidden}</strong></article>
        <article className="stat"><p className="quiet">Enquiries</p><strong>{enquiries}</strong></article>
      </div>
      {rows.map((row) => (
        <p className="quiet-row" key={row.id}>
          <span><strong>{row.title}</strong> · {row.status === "live" ? "Live" : "Hidden"}</span>
          <span className="quiet">{row.views} views · {row.saves} saves · {row.enquiries} enquiries</span>
        </p>
      ))}
    </div>
  );
}
