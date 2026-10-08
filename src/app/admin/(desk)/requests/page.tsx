"use client";

import { useEffect, useState } from "react";

export default function RequestsPage() {
  const [rows, setRows] = useState<{ id: string; kind: string; status: string; agent: string }[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin?part=requests").then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load requests.");
      else setRows(data.requests || []);
    }).catch(() => setError("Could not load requests."));
  }, []);
  if (error) return <p>{error}</p>;
  if (!rows) return <p>Loading requests...</p>;
  return (
    <div className="stack">
      <h1>Requests</h1>
      {rows.length === 0 ? <p>No request yet.</p> : rows.map((row) => (
        <a className="panel" key={row.id} href={`/admin/requests/${row.id}`}><strong>{row.agent}</strong><p className="quiet">{row.kind} · {row.status}</p></a>
      ))}
    </div>
  );
}
