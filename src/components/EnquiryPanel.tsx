"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { digits } from "../lib/labels";
import type { Agent, Listing } from "../lib/data";

export function EnquiryPanel({ listing, agent, viewer, initialSaved }: { listing: Listing; agent: Agent | null; viewer: { name: string; abroad: boolean } | null; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const [day, setDay] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("Morning");

  useEffect(() => {
    if (!viewer) return;
    void fetch("/api/buyer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "view", propertyId: listing.id }) });
  }, [listing.id, viewer]);

  async function toggleSave() {
    const res = await fetch("/api/buyer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: saved ? "unsave" : "save", propertyId: listing.id }) });
    if (res.ok) setSaved(!saved);
    else setSent("The home could not be saved.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>, viewing: boolean) {
    event.preventDefault();
    if (!viewer) return;
    const data = new FormData(event.currentTarget);
    if (viewing && !day) {
      setSent("Choose a preferred day.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/buyer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: viewing ? "viewing" : "enquiry",
        propertyId: listing.id,
        name: data.get("name"),
        phone: data.get("phone"),
        note: data.get("note"),
        abroad: data.get("abroad") === "on",
        moveIn: data.get("moveIn") || "",
        occupants: data.get("occupants") || "",
        day,
        timeOfDay,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    setSent(res.ok ? (viewing ? "Viewing requested." : "Enquiry sent.") : body.error || "The enquiry could not be saved.");
  }

  const wa = agent?.phone ? `https://wa.me/${digits(agent.phone)}?text=${encodeURIComponent("Hello " + agent.name + ", I saw " + listing.title + " on Guyana Keys.")}` : "";

  return (
    <aside className="card"><div className="card-body" style={{ display: "grid", gap: 12 }}>
      <p className="chip">Agent</p>
      {agent ? <h2><Link href={`/agents/${agent.id}`}>{agent.name}</Link></h2> : <h2>The agent has not added a name yet.</h2>}
      {agent ? <p className="meta">{[agent.company, agent.areas.join(", ")].filter(Boolean).join(" · ")}</p> : null}
      {wa ? <a className="btn ghost" href={wa}>WhatsApp {agent?.name.split(" ")[0]}</a> : null}
      {viewer ? (
        <>
          <button className="btn ghost" type="button" onClick={() => void toggleSave()}>{saved ? "Saved" : "Save"}</button>
          <form style={{ display: "grid", gap: 10 }} onSubmit={(event) => {
            const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
            void submit(event, submitter?.value === "viewing");
          }}>
            <input name="name" required placeholder="Your name" defaultValue={viewer.name} style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14 }} />
            <input name="phone" required placeholder="WhatsApp number" style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14 }} />
            <input name="note" placeholder="Note" style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14 }} />
            {listing.purpose === "Rent" ? (
              <>
                <label className="meta">Move-in month<input name="moveIn" type="month" required style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14, width: "100%" }} /></label>
                <label className="meta">Number of occupants<input name="occupants" type="number" min={1} required style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14, width: "100%" }} /></label>
              </>
            ) : null}
            <label className="meta"><input name="abroad" type="checkbox" defaultChecked={viewer.abroad} /> Buying from abroad</label>
            <button className="btn" type="submit" value="enquiry" disabled={busy}>Send enquiry</button>
            <label className="meta">Preferred day<input type="date" value={day} onChange={(event) => setDay(event.target.value)} style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14, width: "100%" }} /></label>
            <label className="meta">Time of day
              <select value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value)} style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14, width: "100%" }}>
                <option>Morning</option><option>Afternoon</option><option>Evening</option>
              </select>
            </label>
            <button className="btn ghost" type="submit" value="viewing" disabled={busy}>Request a viewing</button>
          </form>
        </>
      ) : (
        <Link className="btn" href="/account">Sign in to save or send an enquiry</Link>
      )}
      {sent ? <p>{sent}</p> : null}
    </div></aside>
  );
}
