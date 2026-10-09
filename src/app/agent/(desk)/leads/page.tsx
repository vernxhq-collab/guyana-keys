"use client";

import { useEffect, useState } from "react";

type Lead = { id: string; name: string; home: string; stage: string; stageLabel: string; phone: string; viewingRequest: string; viewingAt: string; agentReply: string; createdAt: string };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agent?part=leads")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => { if (!ok) setError(data.error || "Could not load leads."); else setLeads(data.leads || []); })
      .catch(() => setError("Could not load leads."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!leads) return <p>Loading leads...</p>;
  const shown = leads.filter((lead) => {
    if (filter === "unanswered") return !lead.agentReply && lead.stage !== "closed";
    if (filter === "requested") return Boolean(lead.viewingRequest) && !lead.viewingAt;
    if (filter) return lead.stage === filter;
    return true;
  });
  return (
    <div className="stack">
      <h1>Leads</h1>
      <label>Filter
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">All</option>
          <option value="unanswered">Unanswered</option>
          <option value="requested">Viewing requested</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="viewing">Viewing</option>
          <option value="offer">Offer</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      {shown.length === 0 ? <p>No lead in this list.</p> : shown.map((lead) => (
        <a className="quiet-row" key={lead.id} href={`/agent/leads/${lead.id}`}>
          <span><strong>{lead.name || "Lead"}</strong> · {lead.home}</span>
          <span className="quiet">{lead.stageLabel} · {lead.phone}</span>
        </a>
      ))}
    </div>
  );
}
