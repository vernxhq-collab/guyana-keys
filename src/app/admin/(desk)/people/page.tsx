"use client";

import { useEffect, useState } from "react";

type Agent = { id: string; name: string; company: string; plan: string; planKey: string; live: number; cap: number; suspended: boolean };
type Buyer = { id: string; name: string; email: string; saved: number; enquiries: number };

export default function PeoplePage() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  function load() {
    return fetch("/api/admin?part=people").then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load people.");
      else { setAgents(data.agents || []); setBuyers(data.buyers || []); }
    }).catch(() => setError("Could not load people."));
  }
  useEffect(() => { void load(); }, []);

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
      <h2>Agents</h2>
      {agents.length === 0 ? <p>No agent yet.</p> : agents.map((agent) => (
        <article className="panel" key={agent.id}>
          <strong>{agent.name}</strong>
          <p className="quiet">{agent.company || "No company"} · {agent.plan} · {agent.live} live · cap {agent.cap}{agent.suspended ? " · Suspended" : ""}</p>
          <label>Cap<input defaultValue={agent.cap} onBlur={(event) => void act({ action: "cap", agentId: agent.id, cap: Number(event.target.value) })} /></label>
          <button className="btn ghost" type="button" onClick={() => void act({ action: "plan", agentId: agent.id, plan: agent.planKey === "agency" ? "starter" : "agency" })}>Set plan to {agent.planKey === "agency" ? "starter" : "agency"}</button>
          <button className="btn ghost" type="button" onClick={() => void act({ action: agent.suspended ? "unsuspend" : "suspend", agentId: agent.id })}>{agent.suspended ? "Unsuspend" : "Suspend"}</button>
        </article>
      ))}
      <h2>Buyers</h2>
      {buyers.length === 0 ? <p>No buyer yet.</p> : buyers.map((buyer) => (
        <article className="panel" key={buyer.id}>
          <strong>{buyer.name}</strong>
          <p className="quiet">{buyer.email} · {buyer.saved} saved · {buyer.enquiries} enquiries</p>
        </article>
      ))}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
