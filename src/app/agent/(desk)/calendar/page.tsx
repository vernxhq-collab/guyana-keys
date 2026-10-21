"use client";

import { useEffect, useState } from "react";
import { whenLabel } from "../../../../lib/assist";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";

type Viewing = { id: string; name: string; home: string; viewingAt: string | null; href: string };

export default function CalendarPage() {
  const [rows, setRows] = useState<Viewing[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agent?part=calendar")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => { if (!ok) setError(data.error || "Could not load the calendar."); else setRows(data.viewings || []); })
      .catch(() => setError("Could not load the calendar."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!rows) return <DeskSkeleton count={2} />;

  return (
    <div className="stack">
      <p className="eyebrow">Calendar</p>
      <h1>Viewings</h1>
      <p className="quiet">Times are confirmed by you. Nothing is sent on its own.</p>
      {rows.length === 0 ? <p>No viewing is set.</p> : rows.map((row) => (
        <a className="quiet-row" key={row.id} href={row.href}>
          <span><strong>{row.name}</strong> · {row.home}</span>
          <span className="quiet">{row.viewingAt ? whenLabel(row.viewingAt) : ""}</span>
        </a>
      ))}
    </div>
  );
}
