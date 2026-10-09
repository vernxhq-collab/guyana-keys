"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../components/DeskSkeleton";

type Action = { id: string; text: string; href: string };
type Home = { plan: string; live: number; cap: number; unanswered: number; viewings: number; today: Action[]; error?: string };

export default function AgentHomePage() {
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    const key = "gk-today-" + new Date().toISOString().slice(0, 10);
    setHidden(JSON.parse(localStorage.getItem(key) || "[]"));
    fetch("/api/agent?part=home")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) setError(data.error || "Could not load this desk.");
        else setHome(data);
      })
      .catch(() => setError("Could not load this desk."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!home) return <DeskSkeleton count={3} />;
  if (home.error) return <p>{home.error}</p>;
  const today = (home.today || []).filter((item) => !hidden.includes(item.id)).slice(0, 5);
  const [next, ...rest] = today;

  function dismiss(id: string) {
    const key = "gk-today-" + new Date().toISOString().slice(0, 10);
    const ids = [...hidden, id];
    localStorage.setItem(key, JSON.stringify(ids));
    setHidden(ids);
  }

  return (
    <div className="stack">
      <p className="eyebrow">Agent desk</p>
      <h1>{home.plan}</h1>
      <p className="quiet">{home.plan === "Agency" ? "Paid plan." : "Free plan. 3 live listings."}</p>
      <div className="stats">
        <article className="stat"><p className="quiet">Live listings</p><strong>{home.live} / {home.cap}</strong><p className="quiet">{home.live >= home.cap ? "Cap reached" : `${home.cap - home.live} still open`}</p></article>
        <article className={home.unanswered > 0 ? "stat attention" : "stat"}><p className="quiet">Unanswered enquiries</p><strong>{home.unanswered}</strong><p className="quiet">{home.unanswered > 0 ? "Reply today" : "Clear"}</p></article>
        <article className="stat"><p className="quiet">Viewings in 7 days</p><strong>{home.viewings}</strong><p className="quiet">{home.viewings > 0 ? "This week" : "None set"}</p></article>
      </div>
      <h2>Today</h2>
      {next ? (
        <div className="ai-bar next">
          <a href={next.href}>{next.text}</a>
          <button className="text-btn" type="button" onClick={() => dismiss(next.id)}>Dismiss for today</button>
        </div>
      ) : <p className="ai-bar next"><span>Nothing waiting. You can add a listing.</span></p>}
      {rest.map((item) => (
        <div className="quiet-row" key={item.id}>
          <a href={item.href}>{item.text}</a>
          <button className="text-btn" type="button" onClick={() => dismiss(item.id)}>Dismiss for today</button>
        </div>
      ))}
      <a className="btn" href="/agent/listings/new">New listing</a>
      {home.live >= home.cap ? <p>{home.live} of {home.cap} live listings are in use. <a href="/agent/plan">Request a paid plan</a></p> : null}
    </div>
  );
}
