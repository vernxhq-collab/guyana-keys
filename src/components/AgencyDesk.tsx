"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "./DeskSkeleton";

type Person = { id: string; name: string; live: number; open: number };

export function AgencyDesk() {
  const [agency, setAgency] = useState("");
  const [people, setPeople] = useState<Person[] | null>(null);
  const [held, setHeld] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agent?part=agency")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) setError(data.error || "Could not load the agency.");
        else { setAgency(data.agency || ""); setPeople(data.people || []); setHeld(data.held || 0); }
      })
      .catch(() => setError("Could not load the agency."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!people) return <DeskSkeleton count={2} />;

  return (
    <div className="stack">
      <p className="eyebrow">Agency</p>
      <h1>{agency || "Agency"}</h1>
      <p className="quiet">People in this firm share leads. Another firm cannot see them. {held} message{held === 1 ? "" : "s"} held, none sent.</p>
      {people.map((person) => (
        <p className="quiet-row" key={person.id}><span><strong>{person.name}</strong></span><span className="quiet">{person.live} live · {person.open} open</span></p>
      ))}
    </div>
  );
}
