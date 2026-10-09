"use client";

import { useEffect, useState } from "react";
import { whenLabel } from "../../../../lib/assist";

type Lead = { id: string; name: string; home: string; stage: string; agent: string; createdAt: string };
type Review = { id: string; agent: string; buyer: string; createdAt: string };

export default function InboxPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  function load(query = q) {
    return fetch(`/api/admin?part=inbox&q=${encodeURIComponent(query)}`).then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load the inbox.");
      else { setLeads(data.leads || []); setReviews(data.reviews || []); }
    }).catch(() => setError("Could not load the inbox."));
  }
  useEffect(() => { void load(""); }, []);

  if (error) return <p>{error}</p>;
  if (!leads) return <p>Loading the inbox...</p>;
  return (
    <div className="stack">
      <h1>Inbox</h1>
      <form className="ai-bar" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Home, buyer, or agent" aria-label="Search the inbox" />
        <button className="btn" type="submit">Search</button>
      </form>
      {leads.length === 0 ? <p>No lead yet.</p> : leads.map((lead) => (
        <a className="quiet-row" key={lead.id} href={`/admin/inbox/${lead.id}`}>
          <span><strong>{lead.name}</strong> · {lead.home}</span>
          <span className="quiet">{lead.agent} · {lead.stage} · {whenLabel(lead.createdAt)}</span>
        </a>
      ))}
      <h2>Review requests</h2>
      {reviews.length === 0 ? <p>No review request.</p> : reviews.map((review) => (
        <div className="quiet-row" key={review.id}>
          <span>{review.buyer} · {review.agent}</span>
          <span className="quiet">{whenLabel(review.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
