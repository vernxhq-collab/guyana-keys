"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";

export default function ComposePage() {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const listing = new URLSearchParams(window.location.search).get("id") || "";
    setId(listing);
    if (!listing) { setError("Choose a listing from Today."); return; }
    fetch("/api/agent?part=compose&id=" + encodeURIComponent(listing))
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data.error) setError(data.error || "Could not open this listing.");
        else { setTitle(data.listing.title); setDescription(data.listing.description || ""); }
      })
      .catch(() => setError("Could not open this listing."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!title) return <DeskSkeleton count={2} />;

  return (
    <div className="stack">
      <p className="eyebrow">Listing draft</p>
      <h1>{title}</h1>
      <p className="quiet">The draft is written on this desk. It is not a valuation, and it is not sent anywhere.</p>
      <label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Corner lot, veranda, generator" /></label>
      <button className="btn ghost" type="button" onClick={async () => {
        const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describe", id, notes }) });
        const data = await res.json();
        if (!res.ok) setMessage(data.error || "AI is not available, continue manually.");
        else { setDescription(data.description || ""); setMessage("Draft ready. Edit it before you save."); }
      }}>Write the listing</button>
      <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <button className="btn" type="button" onClick={async () => {
        const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveDescription", id, description }) });
        const data = await res.json();
        setMessage(res.ok ? "Description saved on the test desk." : data.error || "Could not save.");
      }}>Save description</button>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
