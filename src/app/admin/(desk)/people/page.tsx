"use client";

import { useEffect, useState } from "react";

type Agent = { id: string; name: string; company: string; email: string; plan: string; planKey: string; live: number; cap: number; suspended: boolean };
type Buyer = { id: string; name: string; email: string; saved: number; enquiries: number };

export default function PeoplePage() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [caps, setCaps] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  function load(query = q) {
    return fetch(`/api/admin?part=people&q=${encodeURIComponent(query)}`).then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load people.");
      else { setAgents(data.agents || []); setBuyers(data.buyers || []); }
    }).catch(() => setError("Could not load people."));
  }
  useEffect(() => { void load(""); }, []);

  async function act(body: Record<string, unknown>) {
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setNote(res.ok ? "Saved." : data.error || "That could not be saved.");
    if (res.ok) await load();
  }

  if (error) return <p>{error}</p>;
  if (!agents) return <p>Loading people...</p>;
  return (
    <div className="stack">
      <h1>People</h1>
      <form className="ai-bar" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, company, or email" aria-label="Search people" />
        <button className="btn" type="submit">Search</button>
      </form>
      <h2>Agents</h2>
      {agents.length === 0 ? <p>No agent yet.</p> : agents.map((agent) => (
        <article className="record" key={agent.id}>
          <div className="record-main">
            <strong>{agent.name}</strong>
            <span className="quiet">{agent.company || "No company"} · {agent.plan} · {agent.live} of {agent.cap} live{agent.suspended ? " · Suspended" : ""}</span>
          </div>
          <div className="record-actions">
            <label className="quiet">Cap
              <input className="cap-input" inputMode="numeric" value={caps[agent.id] ?? String(agent.cap)} onChange={(event) => setCaps({ ...caps, [agent.id]: event.target.value })} />
            </label>
            <button className="text-btn" type="button" onClick={() => void act({ action: "cap", agentId: agent.id, cap: Number(caps[agent.id] ?? agent.cap) })}>Save cap</button>
            <button className="btn ghost" type="button" onClick={() => void act({ action: "plan", agentId: agent.id, plan: agent.planKey === "agency" ? "starter" : "agency" })}>Set plan to {agent.planKey === "agency" ? "starter" : "agency"}</button>
            <button className="btn ghost" type="button" onClick={() => {
              const message = agent.suspended ? "Restore this agent? Listings that were live will show again." : "Suspend this agent? Their live listings will be hidden.";
              if (!window.confirm(message)) return;
              void act({ action: agent.suspended ? "unsuspend" : "suspend", agentId: agent.id });
            }}>{agent.suspended ? "Unsuspend" : "Suspend"}</button>
          </div>
        </article>
      ))}
      <h2>Buyers</h2>
      {buyers.length === 0 ? <p>No buyer yet.</p> : buyers.map((buyer) => (
        <div className="quiet-row" key={buyer.id}>
          <span><strong>{buyer.name}</strong></span>
          <span className="quiet">{buyer.email} · {buyer.saved} saved · {buyer.enquiries} enquiries</span>
        </div>
      ))}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
