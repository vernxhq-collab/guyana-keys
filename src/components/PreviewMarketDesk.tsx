"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { draftReply } from "../lib/ai/local";
import { SAMPLE_LABEL } from "../lib/sample-label";

const stages = ["New", "Contacted", "Viewing", "Offer", "Closed"] as const;
type Stage = (typeof stages)[number];

type Enquiry = {
  id: string;
  name: string;
  home: string;
  area: string;
  source: string;
  stage: Stage;
  note: string;
  followUp: string | null;
  abroad: boolean;
};

const opening: Enquiry[] = [
  { id: "sample-maria", name: "Maria Singh", home: "Raised house, Bel Air Park", area: "Bel Air Park", source: "Listing page", stage: "New", note: "Writing from Toronto. Is Thursday afternoon possible?", followUp: "Today", abroad: true },
  { id: "sample-kevin", name: "Kevin Hall", home: "Riverside house, New Amsterdam", area: "New Amsterdam", source: "Listing page", stage: "Contacted", note: "Asked if the house is still available.", followUp: "Tomorrow", abroad: false },
  { id: "sample-priya", name: "Priya Ramdass", home: "Flat in Kitty", area: "Kitty", source: "Saved search", stage: "Viewing", note: "Asked for a Saturday morning viewing.", followUp: "Saturday", abroad: false },
  { id: "sample-andre", name: "Andre Campbell", home: "Providence draft", area: "Providence", source: "Partner form", stage: "Offer", note: "Asked what is still needed before an offer.", followUp: null, abroad: false },
  { id: "sample-nadia", name: "Nadia Persaud", home: "Raised house, Bel Air Park", area: "Bel Air Park", source: "Guide page", stage: "New", note: "Asked about the title papers before a visit.", followUp: "Today", abroad: false },
  { id: "sample-liam", name: "Liam Fraser", home: "Flat in Kitty", area: "Kitty", source: "Direct", stage: "Closed", note: "Sample enquiry already closed.", followUp: null, abroad: false },
];

const health = [
  { title: "Raised house, Bel Air Park", state: "Photos missing", detail: "1 of 3 photos. Add landscape photos before this sample can go live." },
  { title: "Riverside house, New Amsterdam", state: "Expiring", detail: "Sample expiry in 5 days." },
  { title: "Providence draft", state: "Photos missing", detail: "Hidden. No photos yet." },
];

export function PreviewMarketDesk() {
  const [rows, setRows] = useState(opening);
  const [selected, setSelected] = useState(opening[0].id);
  const [dragging, setDragging] = useState("");
  const active = rows.find((row) => row.id === selected) || rows[0];
  const draft = useMemo(
    () => draftReply({ name: active.name, home: active.home, area: active.area, note: active.note, abroad: active.abroad, viewingAt: active.stage === "Viewing" ? "Saturday" : null }).message,
    [active],
  );
  const followUps = rows.filter((row) => row.followUp);
  const counts = {
    fresh: rows.filter((row) => row.stage === "New").length,
    due: followUps.length,
    viewings: rows.filter((row) => row.stage === "Viewing").length,
  };

  function moveTo(id: string, stage: Stage) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, stage } : row)));
    setSelected(id);
  }

  function step(id: string, direction: -1 | 1) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    const next = stages[stages.indexOf(row.stage) + direction];
    if (next) moveTo(id, next);
  }

  return (
    <main className="market desk-preview">
      <p className="market-banner">{SAMPLE_LABEL}. Nothing here is saved, and nothing is sent.</p>
      <div className="wrap market-section">
        <p className="market-kicker">Agent desk preview</p>
        <div className="desk-preview-head">
          <h1>Today</h1>
          <Link className="btn" href="/agent/listings/new">Add a listing</Link>
        </div>
        <div className="desk-preview-stats">
          <article><span>New enquiries</span><strong>{counts.fresh}</strong><p>Sample cards still in New.</p></article>
          <article><span>Follow-ups due</span><strong>{counts.due}</strong><p>Sample tasks still open.</p></article>
          <article><span>Viewings</span><strong>{counts.viewings}</strong><p>Sample cards in Viewing.</p></article>
        </div>

        <h2>Follow-ups due</h2>
        <ul className="desk-followups">
          {followUps.map((row) => (
            <li key={row.id}>
              <button type="button" onClick={() => setSelected(row.id)}>
                <strong>{row.name}</strong>
                <span>{row.followUp}</span>
                <span>{row.home}</span>
              </button>
            </li>
          ))}
        </ul>

        <h2>Pipeline</h2>
        <p className="meta">Sample preview. Move a card with the buttons, or drag it on a wide screen. This stays in the browser.</p>
        <div className="pipeline-board">
          {stages.map((stage) => (
            <section
              key={stage}
              className="pipeline-column"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => { if (dragging) moveTo(dragging, stage); setDragging(""); }}
            >
              <h3>{stage}<span>{rows.filter((row) => row.stage === stage).length}</span></h3>
              {rows.filter((row) => row.stage === stage).map((row) => (
                <article
                  key={row.id}
                  className={row.id === selected ? "pipeline-card on" : "pipeline-card"}
                  draggable
                  onDragStart={() => setDragging(row.id)}
                >
                  <p className="market-sample">Sample preview</p>
                  <p className="lead-tag">🔑 Guyana Keys Lead</p>
                  <strong>{row.name}</strong>
                  <p>{row.home}</p>
                  <p className="meta">Source: {row.source}</p>
                  <div className="pipeline-moves">
                    <button type="button" onClick={() => step(row.id, -1)} disabled={stage === stages[0]}>Previous</button>
                    <button type="button" onClick={() => step(row.id, 1)} disabled={stage === stages[stages.length - 1]}>Next</button>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>

        <div className="desk-preview-grid">
          <section className="market-panel">
            <h2>Listing health</h2>
            <ul className="desk-health">
              {health.map((item) => (
                <li key={item.title}>
                  <p className="market-sample">Sample preview</p>
                  <strong>{item.title}</strong>
                  <p className="market-warn">{item.state}</p>
                  <p className="meta">{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="market-panel">
            <h2>Enquiries</h2>
            <ul className="desk-enquiries">
              {rows.map((row) => (
                <li key={row.id}>
                  <button type="button" className={row.id === selected ? "on" : ""} onClick={() => setSelected(row.id)}>
                    <p className="lead-tag">🔑 Guyana Keys Lead</p>
                    <strong>{row.name}</strong>
                    <span>{row.home}</span>
                    <span>Source: {row.source}</span>
                    <span>{row.stage}{row.followUp ? ` · Follow-up ${row.followUp}` : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="market-panel">
            <h2>Draft — you send</h2>
            <p className="market-sample">Sample preview. {active.name} · {active.home}</p>
            <label className="desk-draft">Reply draft
              <textarea readOnly value={draft} />
            </label>
            <p className="meta">Draft — you send. This preview cannot send it.</p>
            <button className="btn" type="button" disabled>Send stays off in this preview</button>
          </section>
        </div>
      </div>
    </main>
  );
}
