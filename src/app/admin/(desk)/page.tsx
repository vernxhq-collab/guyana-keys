"use client";

import { useEffect, useState } from "react";

type Home = { agents: number; live: number; unanswered: number; openRequests: number; requests: { id: string; line: string; status: string; kind: string }[]; error?: string };

export default function AdminHomePage() {
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin?part=home").then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load this desk.");
      else setHome(data);
    }).catch(() => setError("Could not load this desk."));
  }, []);
  if (error) return <p>{error}</p>;
  if (!home) return <p>Loading the desk...</p>;
  return (
    <div className="stack">
      <h1>Admin</h1>
      <div className="stats">
        <article className="card"><div className="card-body"><p className="quiet">Agents</p><p className="price">{home.agents}</p></div></article>
        <article className="card"><div className="card-body"><p className="quiet">Live listings</p><p className="price">{home.live}</p></div></article>
        <article className="card"><div className="card-body"><p className="quiet">Unanswered over 24 hours</p><p className="price">{home.unanswered}</p></div></article>
        <article className="card"><div className="card-body"><p className="quiet">Open requests</p><p className="price">{home.openRequests}</p></div></article>
      </div>
      <h2>Open requests</h2>
      {home.requests.length === 0 ? <p>No open request.</p> : home.requests.map((item) => (
        <a className="panel" key={item.id} href={`/admin/requests/${item.id}`}><p>{item.line}</p><p className="quiet">{item.status}</p></a>
      ))}
    </div>
  );
}
