"use client";

import { useEffect, useState } from "react";

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
  if (!home) return <p>Loading your desk...</p>;
  if (home.error) return <p>{home.error}</p>;
  const today = (home.today || []).filter((item) => !hidden.includes(item.id)).slice(0, 5);

  function dismiss(id: string) {
    const key = "gk-today-" + new Date().toISOString().slice(0, 10);
    const next = [...hidden, id];
    localStorage.setItem(key, JSON.stringify(next));
    setHidden(next);
  }

  return (
    <div className="stack">
      <h1>{home.plan}</h1>
      <div className="stats">
        <article className="card"><div className="card-body"><p className="quiet">Live listings</p><p className="price">{home.live} / {home.cap}</p></div></article>
        <article className="card"><div className="card-body"><p className="quiet">Unanswered enquiries</p><p className="price">{home.unanswered}</p></div></article>
        <article className="card"><div className="card-body"><p className="quiet">Viewings in 7 days</p><p className="price">{home.viewings}</p></div></article>
      </div>
      <h2>Today</h2>
      {today.length === 0 ? <p className="quiet">Nothing waiting. You can add a listing.</p> : today.map((item) => (
        <article className="panel" key={item.id}>
          <a href={item.href}>{item.text}</a>
          <button className="btn ghost" type="button" onClick={() => dismiss(item.id)}>Dismiss for today</button>
        </article>
      ))}
      <a className="btn" href="/agent/listings/new">New listing</a>
      {home.live >= home.cap ? <p>{home.live} of {home.cap} live listings are in use. <a href="/agent/plan">Request a paid plan</a></p> : null}
    </div>
  );
}
