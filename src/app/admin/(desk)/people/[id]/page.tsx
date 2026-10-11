"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DeskSkeleton } from "../../../../../components/DeskSkeleton";
import { whenLabel } from "../../../../../lib/assist";
import { money } from "../../../../../lib/data";
import { requestKindLabel, requestStatusLabel, stageLabel } from "../../../../../lib/labels";

type Agent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  photoUrl: string;
  areas: string[];
  plan: string;
  planKey: string;
  cap: number;
  live: number;
  suspended: boolean;
  createdAt: string;
};
type Listing = { id: string; title: string; area: string; purpose: string; priceGyd: number; status: string; featured: boolean };
type Lead = { id: string; name: string; phone: string; stage: string; home: string; createdAt: string; answered: boolean };
type RequestRow = { id: string; kind: string; status: string; listing: string; message: string; createdAt: string };

export default function AdminAgentPage() {
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [cap, setCap] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  function load() {
    return fetch(`/api/admin?part=agent&id=${params.id}`).then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load this agent.");
      else {
        setAgent(data.agent);
        setListings(data.listings || []);
        setLeads(data.leads || []);
        setRequests(data.requests || []);
        setCap(String(data.agent?.cap ?? ""));
      }
    }).catch(() => setError("Could not load this agent."));
  }
  useEffect(() => { void load(); }, [params.id]);

  async function act(body: Record<string, unknown>) {
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setNote(res.ok ? "Saved." : data.error || "That could not be saved.");
    if (res.ok) await load();
  }

  if (error) return <p>{error}</p>;
  if (!agent) return <DeskSkeleton count={3} />;
  const missing = [
    !agent.name ? "Name" : "",
    !agent.phone ? "WhatsApp" : "",
    !agent.company ? "Company" : "",
    !agent.address ? "Address" : "",
    agent.areas.length === 0 ? "Areas" : "",
    !agent.photoUrl ? "Photo" : "",
  ].filter(Boolean);
  return (
    <div className="stack">
      <p className="quiet"><a href="/admin/people">People</a></p>
      <h1>{agent.name || "Agent"}</h1>
      <p className="quiet">{agent.suspended ? "Suspended." : agent.plan} · {agent.live} of {agent.cap} live listings.</p>
      <p className="ai-bar next"><span>{missing.length ? `Still needed: ${missing.join(", ")}.` : "Profile is complete."}</span></p>
      <article className="panel">
        {agent.photoUrl ? <img src={agent.photoUrl} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12 }} /> : <p>Photo not set</p>}
        <p>Email {agent.email || "not set"}</p>
        <p>WhatsApp {agent.phone || "not set"}</p>
        <p>Company {agent.company || "not set"}</p>
        <p>Address {agent.address || "not set"}</p>
        <p>Areas {agent.areas.length ? agent.areas.join(", ") : "not set"}</p>
        <p>Joined {whenLabel(agent.createdAt) || "not set"}</p>
      </article>
      <div className="actions">
        <label className="quiet">Cap
          <input className="cap-input" inputMode="numeric" value={cap} onChange={(event) => setCap(event.target.value)} />
        </label>
        <button className="btn" type="button" onClick={() => void act({ action: "cap", agentId: agent.id, cap: Number(cap) })}>Save cap</button>
        <button className="btn ghost" type="button" onClick={() => void act({ action: "plan", agentId: agent.id, plan: agent.planKey === "agency" ? "starter" : "agency" })}>Set plan to {agent.planKey === "agency" ? "starter" : "agency"}</button>
        <button className="btn ghost" type="button" onClick={() => {
          const message = agent.suspended ? "Restore this agent? Listings that were live will show again." : "Suspend this agent? Their live listings will be hidden.";
          if (!window.confirm(message)) return;
          void act({ action: agent.suspended ? "unsuspend" : "suspend", agentId: agent.id });
        }}>{agent.suspended ? "Unsuspend" : "Suspend"}</button>
      </div>
      {note ? <p>{note}</p> : null}
      <h2>Listings</h2>
      {listings.length === 0 ? <p className="quiet">No listing yet.</p> : listings.map((item) => (
        <p className="quiet-row" key={item.id}>
          <span><strong>{item.title}</strong>{item.area ? ` · ${item.area}` : ""} · {money(item.priceGyd, item.purpose)}</span>
          <span className="quiet">{item.status === "live" ? "Live" : "Hidden"} · {item.featured ? "Featured" : "Not featured"}</span>
        </p>
      ))}
      <h2>Leads</h2>
      {leads.length === 0 ? <p className="quiet">No lead yet.</p> : leads.map((lead) => (
        <a className="quiet-row" key={lead.id} href={`/admin/inbox/${lead.id}`}>
          <span><strong>{lead.name || "Lead"}</strong>{lead.home ? ` · ${lead.home}` : ""}</span>
          <span className="quiet">{stageLabel(lead.stage)} · {lead.phone || "No phone"} · {lead.answered ? "Answered" : "No reply"}</span>
        </a>
      ))}
      <h2>Requests</h2>
      {requests.length === 0 ? <p className="quiet">No request yet.</p> : requests.map((item) => (
        <a className="quiet-row" key={item.id} href={`/admin/requests/${item.id}`}>
          <span><strong>{requestKindLabel(item.kind)}</strong>{item.listing ? ` · ${item.listing}` : ""}{item.message ? ` · ${item.message}` : ""}</span>
          <span className="quiet">{requestStatusLabel(item.status)} · {whenLabel(item.createdAt)}</span>
        </a>
      ))}
    </div>
  );
}
