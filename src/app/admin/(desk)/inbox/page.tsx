"use client";

import { useEffect, useState } from "react";
import { whenLabel } from "../../../../lib/assist";

export default function InboxPage() {
  const [leads, setLeads] = useState<{ id: string; name: string; stage: string; agent: string; createdAt: string }[] | null>(null);
  const [reviews, setReviews] = useState<{ id: string; agent: string; buyer: string; createdAt: string }[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin?part=inbox").then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load the inbox.");
      else { setLeads(data.leads || []); setReviews(data.reviews || []); }
    }).catch(() => setError("Could not load the inbox."));
  }, []);
  if (error) return <p>{error}</p>;
  if (!leads) return <p>Loading the inbox...</p>;
  return (
    <div className="stack">
      <h1>Inbox</h1>
      {leads.length === 0 ? <p>No lead yet.</p> : leads.map((lead) => (
        <a className="panel" key={lead.id} href={`/admin/inbox/${lead.id}`}><strong>{lead.name}</strong><p className="quiet">{lead.agent} · {lead.stage} · {whenLabel(lead.createdAt)}</p></a>
      ))}
      <h2>Review requests</h2>
      {reviews.length === 0 ? <p>No review request.</p> : reviews.map((review) => (
        <article className="panel" key={review.id}><p>{review.buyer} · {review.agent}</p><p className="quiet">{whenLabel(review.createdAt)}</p></article>
      ))}
    </div>
  );
}
