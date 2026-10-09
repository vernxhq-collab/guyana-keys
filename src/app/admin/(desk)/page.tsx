"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../components/DeskSkeleton";

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
  if (!home) return <DeskSkeleton count={4} />;
  const [next, ...rest] = home.requests || [];
  return (
    <div className="stack">
      <h1>Admin</h1>
      <div className="stats">
        <article className="stat"><p className="quiet">Agents</p><strong>{home.agents}</strong></article>
        <article className="stat"><p className="quiet">Live listings</p><strong>{home.live}</strong></article>
        <article className={home.unanswered > 0 ? "stat attention" : "stat"}><p className="quiet">Unanswered over 24 hours</p><strong>{home.unanswered}</strong></article>
        <article className="stat"><p className="quiet">Open requests</p><strong>{home.openRequests}</strong></article>
      </div>
      <h2>Open requests</h2>
      {next ? (
        <a className="ai-bar next" href={`/admin/requests/${next.id}`}><span>{next.line}</span><span className="quiet">{next.status}</span></a>
      ) : <p className="ai-bar next"><span>No open request.</span></p>}
      {rest.map((item) => (
        <a className="quiet-row" key={item.id} href={`/admin/requests/${item.id}`}><span>{item.line}</span><span className="quiet">{item.status}</span></a>
      ))}
    </div>
  );
}
