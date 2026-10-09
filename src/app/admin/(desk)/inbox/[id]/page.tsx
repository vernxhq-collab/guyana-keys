"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { whenLabel } from "../../../../../lib/assist";

export default function AdminLeadPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<Record<string, string | number | boolean | null> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/admin?part=lead&id=${params.id}`).then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load this lead.");
      else setLead(data.lead);
    }).catch(() => setError("Could not load this lead."));
  }, [params.id]);
  if (error) return <p>{error}</p>;
  if (!lead) return <p>Loading the lead...</p>;
  return (
    <article className="stack">
      <h1>{String(lead.name || "Lead")}</h1>
      <p>{String(lead.home || "")}{lead.area ? ` · ${lead.area}` : ""}</p>
      <p>Agent: {String(lead.agent || "")}</p>
      <p>Buyer: {String(lead.buyer || "")}{lead.email ? ` · ${lead.email}` : ""}</p>
      <p>WhatsApp {String(lead.phone || "")}</p>
      <p>{String(lead.note || "No note.")}</p>
      <p>Abroad: {lead.abroad ? "Yes" : "No"}</p>
      {lead.moveIn || lead.occupants ? <p>Move-in {String(lead.moveIn || "not set")} · Occupants {String(lead.occupants || "not set")}</p> : null}
      <p>Stage: {String(lead.stage || "")}</p>
      <p>Score: {String(lead.score || "New")} · {String(lead.nextStep || "")}</p>
      <p>Agent reply: {String(lead.agentReply || "No reply yet.")}</p>
      <p>Viewing: {lead.viewingAt ? whenLabel(String(lead.viewingAt)) : String(lead.viewingRequest || "Not set")}</p>
      <p>Private note: {String(lead.privateNote || "None")}</p>
    </article>
  );
}
