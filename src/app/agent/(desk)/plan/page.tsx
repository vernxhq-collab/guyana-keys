"use client";

import { useEffect, useState } from "react";
import { requestStatusLabel } from "../../../../lib/labels";

type RequestRow = { id: string; kind: string; property_id: string | null; status: string; instructions: string; message: string };
type Live = { id: string; title: string; area: string };

export default function PlanPage() {
  const [plan, setPlan] = useState("");
  const [cap, setCap] = useState(3);
  const [live, setLive] = useState(0);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [listings, setListings] = useState<Live[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    return fetch("/api/agent?part=plan")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data.error) setError(data.error || "Could not load the plan.");
        else {
          setPlan(data.plan);
          setCap(data.cap);
          setLive(data.live);
          setRequests(data.requests || []);
          setListings(data.liveListings || []);
          setPropertyId((data.liveListings || [])[0]?.id || "");
        }
      })
      .catch(() => setError("Could not load the plan."));
  }

  useEffect(() => { void load(); }, []);

  async function send(body: Record<string, unknown>) {
    const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", ...body }) });
    const data = await res.json();
    setMessage(res.ok ? "Submitted." : data.error || "The request could not be sent.");
    if (res.ok) await load();
  }

  if (error) return <p>{error}</p>;
  if (!plan) return <p>Loading the plan...</p>;
  const planRequest = requests.find((item) => item.kind === "plan");
  return (
    <div className="stack">
      <h1>{plan}</h1>
      <p className="quiet">{live} of {cap} live listings.</p>
      {planRequest ? (
        <article className="panel">
          <strong>Paid plan</strong>
          <p>{requestStatusLabel(planRequest.status)}</p>
          {planRequest.instructions ? <p>{planRequest.instructions}</p> : null}
        </article>
      ) : <button className="btn" type="button" onClick={() => void send({ kind: "plan" })}>Request a paid plan</button>}
      <h2>Featured</h2>
      {listings.length === 0 ? <p>Publish a listing before you request featuring.</p> : (
        <div className="panel">
          <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
            {listings.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.area}</option>)}
          </select>
          <button className={planRequest ? "btn" : "btn ghost"} type="button" onClick={() => void send({ kind: "feature", propertyId })}>Request featured</button>
        </div>
      )}
      {requests.filter((item) => item.kind === "feature").map((item) => (
        <article className="panel" key={item.id}>
          <strong>Feature request</strong>
          <p>{requestStatusLabel(item.status)}</p>
          {item.instructions ? <p>{item.instructions}</p> : null}
        </article>
      ))}
      {message ? <p>{message}</p> : null}
    </div>
  );
}
