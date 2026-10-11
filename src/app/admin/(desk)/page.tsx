"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../components/DeskSkeleton";

type AgentRow = { id: string; name: string; email: string; phone: string; company: string; address: string };
type Home = { agents: number; live: number; unanswered: number; openRequests: number; requests: { id: string; line: string; status: string; kind: string }[]; agentList?: AgentRow[]; record?: { id: string; detail: string }[]; error?: string };

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
        <a className="stat" href="/admin/people"><p className="quiet">Agents</p><strong>{home.agents}</strong><p className="quiet">Open People</p></a>
        <a className="stat" href="/admin/listings"><p className="quiet">Live listings</p><strong>{home.live}</strong><p className="quiet">Open Listings</p></a>
        <a className={home.unanswered > 0 ? "stat attention" : "stat"} href="/admin/inbox"><p className="quiet">Unanswered over 24 hours</p><strong>{home.unanswered}</strong><p className="quiet">Open Inbox</p></a>
        <a className="stat" href="/admin/requests"><p className="quiet">Open requests</p><strong>{home.openRequests}</strong><p className="quiet">Open Requests</p></a>
      </div>
      <h2>Agents</h2>
      {(home.agentList || []).length === 0 ? <p className="quiet">No agent yet.</p> : (home.agentList || []).map((agent) => (
        <a className="quiet-row" key={agent.id} href={`/admin/people/${agent.id}`}>
          <span><strong>{agent.name || "Agent"}</strong>{agent.company ? ` · ${agent.company}` : ""}</span>
          <span className="quiet">{[agent.email, agent.phone, agent.address].filter(Boolean).join(" · ") || "No contact details yet"}</span>
        </a>
      ))}
      <h2>Open requests</h2>
      {next ? (
        <a className="ai-bar next" href={`/admin/requests/${next.id}`}><span>{next.line}</span><span className="quiet">{next.status}</span></a>
      ) : <p className="ai-bar next"><span>No open request.</span></p>}
      {rest.map((item) => (
        <a className="quiet-row" key={item.id} href={`/admin/requests/${item.id}`}><span>{item.line}</span><span className="quiet">{item.status}</span></a>
      ))}
      <h2>Record</h2>
      {(home.record || []).length === 0 ? <p className="quiet">No record yet.</p> : (home.record || []).map((item) => (
        <p className="quiet-row" key={item.id}><span>{item.detail}</span></p>
      ))}
    </div>
  );
}
