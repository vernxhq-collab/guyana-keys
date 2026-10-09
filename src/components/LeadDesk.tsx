"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "./DeskSkeleton";
import { digits, eventLabel, stageLabel } from "../lib/labels";
import { whenLabel } from "../lib/assist";

type Lead = {
  id: string;
  name: string;
  phone: string;
  note: string;
  abroad: boolean;
  moveIn: string;
  occupants: number | null;
  stage: string;
  stageLabel: string;
  score: string;
  sentence: string;
  nextStep: string;
  reminder: boolean;
  viewingAt: string;
  viewingRequest: string;
  home: string;
  area: string;
  privateNote: string;
  reviewRequested: boolean;
  draft: string;
  agentReply: string;
  timeline: { id: string; kind: string; detail: string; createdAt: string }[];
};

export function LeadDesk({ id }: { id: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState("new");
  const [when, setWhen] = useState("");
  const [message, setMessage] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/agent?part=lead&id=${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load this lead.");
      return;
    }
    setLead(data.lead);
    setReply(data.lead.draft || "");
    setNote(data.lead.privateNote || "");
    setStage(data.lead.stage || "new");
    setWhen(data.lead.viewingAt ? data.lead.viewingAt.slice(0, 16) : "");
  }

  useEffect(() => { void load(); }, [id]);

  async function save(body: Record<string, unknown>) {
    const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "lead", id, ...body }) });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "The lead could not be saved.");
      return false;
    }
    await load();
    return true;
  }

  if (error) return <p>{error}</p>;
  if (!lead) return <DeskSkeleton count={3} />;
  const wa = `https://wa.me/${digits(lead.phone)}?text=${encodeURIComponent(reply)}`;

  return (
    <div className="stack">
      <p className="eyebrow">Lead</p>
      <h1>{lead.name || "Lead"}</h1>
      <p className="quiet">{lead.home}{lead.area ? ` · ${lead.area}` : ""}</p>
      <div className="stats">
        <article className="stat">
          <p className="quiet">Score</p>
          <strong>{lead.score}</strong>
          <p className="quiet">{lead.sentence}</p>
        </article>
        <article className="stat">
          <p className="quiet">Stage</p>
          <strong>{lead.stageLabel}</strong>
          <p className="quiet">{lead.viewingAt ? "Viewing set" : lead.viewingRequest ? "Viewing requested" : "No viewing yet"}</p>
        </article>
        <article className={lead.reminder ? "stat attention" : "stat"}>
          <p className="quiet">Reply</p>
          <strong>{lead.reminder ? "Overdue" : "Clear"}</strong>
          <p className="quiet">{lead.phone || "No WhatsApp"}</p>
        </article>
      </div>
      <div className="ai-bar next">
        <span>{lead.nextStep}</span>
        {lead.reminder ? <span className="quiet">No reply for over 24 hours.</span> : null}
      </div>
      <article className="panel">
        <p>WhatsApp {lead.phone || "not given"}</p>
        <p>{lead.note || "No note."}</p>
        <p>Abroad: {lead.abroad ? "Yes" : "No"}</p>
        {lead.moveIn || lead.occupants ? <p>Move-in {lead.moveIn || "not set"} · Occupants {lead.occupants ?? "not set"}</p> : null}
        {lead.viewingRequest ? <p>Viewing requested: {lead.viewingRequest}</p> : null}
      </article>
      <label>Stage
        <select value={stage} onChange={async (event) => { setStage(event.target.value); await save({ stage: event.target.value }); }}>
          {["new", "contacted", "viewing", "offer", "closed"].map((item) => <option key={item} value={item}>{stageLabel(item)}</option>)}
        </select>
      </label>
      <label>Reply<textarea value={reply} onChange={(event) => setReply(event.target.value)} /></label>
      {aiNote ? <p>{aiNote}</p> : null}
      <p className="quiet">Nothing is sent until you open WhatsApp yourself.</p>
      <div className="actions">
        <button className="btn ghost" type="button" onClick={async () => {
          const res = await fetch("/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "reply-draft", lead: { name: lead.name, listing: lead.home, viewingAt: lead.viewingAt || null } }) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.message) setAiNote("AI is not available, continue manually.");
          else { setReply(data.message); setAiNote(""); }
        }}>Draft reply</button>
        <button className="btn ghost" type="button" onClick={async () => { await navigator.clipboard.writeText(reply); await save({ reply, saveDraft: true }); setMessage("Copied."); }}>Copy</button>
        <a className="btn" href={wa} target="_blank" rel="noreferrer" onClick={() => void save({ reply, openWhatsapp: true })}>Open WhatsApp</a>
      </div>
      <label>Viewing time<input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} /></label>
      <div className="actions">
        <button className="btn ghost" type="button" onClick={() => void save({ viewingAt: when })}>Set viewing</button>
        <button className="btn ghost" type="button" onClick={() => void save({ clearViewing: true })}>Clear viewing</button>
      </div>
      <label>Private note<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <div className="actions">
        <button className="btn ghost" type="button" onClick={async () => { if (await save({ privateNote: note })) setMessage("Note saved."); }}>Save note</button>
      </div>
      <p className="quiet">Only you can see the private note.</p>
      {lead.stage === "closed" ? (
        <button className="btn ghost" type="button" disabled={lead.reviewRequested} onClick={() => void save({ askReview: true })}>{lead.reviewRequested ? "Review requested" : "Ask for a review"}</button>
      ) : null}
      {message ? <p>{message}</p> : null}
      <h2>Timeline</h2>
      {lead.timeline.length === 0 ? <p className="quiet">No events yet.</p> : lead.timeline.map((event) => (
        <p className="quiet-row" key={event.id}>
          <span><strong>{eventLabel(event.kind)}</strong>{event.detail ? ` · ${event.detail}` : ""}</span>
          <span className="quiet">{whenLabel(event.createdAt)}</span>
        </p>
      ))}
    </div>
  );
}
