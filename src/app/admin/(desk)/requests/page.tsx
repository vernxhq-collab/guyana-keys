"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";
import { requestKindLabel } from "../../../../lib/labels";

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
  if (!rows) return <DeskSkeleton count={3} />;
  return (
    <div className="stack">
      <h1>Requests</h1>
      <p className="quiet">Package upgrades and featured listings wait here until you send payment instructions and mark them paid.</p>
      {rows.length === 0 ? <p>No request yet.</p> : rows.map((row) => (
        <a className="quiet-row" key={row.id} href={`/admin/requests/${row.id}`}>
          <span><strong>{row.agent}</strong> · {requestKindLabel(row.kind)}</span>
          <span className="quiet">{row.status}</span>
        </a>
      ))}
    </div>
  );
}
