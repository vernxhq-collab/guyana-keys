"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";

type Lead = { id: string; name: string; home: string; stage: string; stageLabel: string; phone: string; viewingRequest: string; viewingAt: string; agentReply: string; createdAt: string };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFilter(new URLSearchParams(window.location.search).get("filter") || "");
    fetch("/api/agent?part=leads")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => { if (!ok) setError(data.error || "Could not load leads."); else setLeads(data.leads || []); })
      .catch(() => setError("Could not load leads."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!leads) return <DeskSkeleton count={3} />;
  const shown = leads.filter((lead) => {
    if (filter === "unanswered") return !lead.agentReply && lead.stage !== "closed";
    if (filter === "requested") return Boolean(lead.viewingRequest) && !lead.viewingAt;
    if (filter) return lead.stage === filter;
    return true;
  });
  const unanswered = leads.filter((lead) => !lead.agentReply && lead.stage !== "closed").length;
  const requested = leads.filter((lead) => Boolean(lead.viewingRequest) && !lead.viewingAt).length;
  const viewing = leads.filter((lead) => lead.stage === "viewing").length;
  const nextLine = unanswered
    ? "Reply to unanswered enquiries."
    : requested
      ? "A viewing was requested."
      : "No lead is waiting.";

  return (
    <div className="stack">
      <p className="eyebrow">Leads</p>
      <h1>Leads</h1>
      <p className="quiet">Each row is one enquiry. Filter by stage, or open a lead.</p>
      <div className="stats">
        <a className={unanswered > 0 ? "stat attention" : "stat"} href="/agent/leads?filter=unanswered"><p className="quiet">Unanswered</p><strong>{unanswered}</strong><p className="quiet">{unanswered ? "Reply today" : "Clear"}</p></a>
        <a className="stat" href="/agent/leads?filter=requested"><p className="quiet">Viewing requested</p><strong>{requested}</strong><p className="quiet">{requested ? "Needs a time" : "None waiting"}</p></a>
        <a className="stat" href="/agent/leads?filter=viewing"><p className="quiet">Viewing</p><strong>{viewing}</strong><p className="quiet">{viewing ? "On the calendar" : "None set"}</p></a>
      </div>
      <p className="ai-bar next"><span>{nextLine}</span></p>
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
