"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../components/DeskSkeleton";

type Action = { id: string; text: string; href: string };
type Home = { plan: string; live: number; cap: number; unanswered: number; viewings: number; today: Action[]; greetingName?: string; agency?: string; audits?: { id: string; at: string; actor: string; detail: string }[]; error?: string; preview?: boolean };

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

  const hour = Number(new Intl.DateTimeFormat("en-GY", { hour: "numeric", hourCycle: "h23", timeZone: "America/Guyana" }).format(new Date()));
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const who = home.greetingName ? `, ${home.greetingName.split(" ")[0]}` : "";

  return (
    <div className="stack">
      <p className="eyebrow">{home.agency || "Agent desk"}</p>
      <h1>{hello}{who}.</h1>
      <p className="quiet">Here is your business today.</p>
      <div className="stats">
        <a className={home.unanswered > 0 ? "stat attention" : "stat"} href="/agent/leads?filter=unanswered"><p className="quiet">Need a reply</p><strong>{home.unanswered}</strong><p className="quiet">{home.unanswered > 0 ? "Reply today" : "Clear"}</p></a>
        <a className="stat" href="/agent/calendar"><p className="quiet">Viewings this week</p><strong>{home.viewings}</strong><p className="quiet">{home.viewings > 0 ? "On the calendar" : "None set"}</p></a>
        <a className="stat" href="/agent/listings"><p className="quiet">Live listings</p><strong>{home.live}</strong><p className="quiet">{home.preview ? "Test stock" : `${home.live} of ${home.cap}`}</p></a>
      </div>
      <h2>Today</h2>
      {next ? (
        <div className="ai-bar next">
          <a href={next.href}>{next.text}</a>
          <button className="text-btn" type="button" onClick={() => dismiss(next.id)}>Dismiss for today</button>
        </div>
      ) : <p className="ai-bar next"><span>Nothing waiting.</span></p>}
      {rest.map((item) => (
        <div className="quiet-row" key={item.id}>
          <a href={item.href}>{item.text}</a>
          <button className="text-btn" type="button" onClick={() => dismiss(item.id)}>Dismiss for today</button>
        </div>
      ))}
      <a className="btn" href={next?.href || "/agent/listings/new"}>{next ? "Open the next task" : "New listing"}</a>
      {home.audits && home.audits.length > 0 ? (
        <>
          <h2>Audit</h2>
          {home.audits.map((item) => (
            <p className="quiet-row" key={item.id}><span>{item.actor}: {item.detail}</span></p>
          ))}
        </>
      ) : null}
    </div>
  );
}
