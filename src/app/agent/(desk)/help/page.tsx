"use client";

import { useEffect, useState } from "react";
import { requestStatusLabel } from "../../../../lib/labels";

export default function HelpPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<{ id: string; status: string; message: string }[]>([]);

  useEffect(() => {
    fetch("/api/agent?part=plan").then((res) => res.json()).then((data) => {
      setRows((data.requests || []).filter((item: { kind: string }) => item.kind === "help"));
    }).catch(() => setNote("Could not load help requests."));
  }, []);

  return (
    <form className="stack" onSubmit={async (event) => {
      event.preventDefault();
      const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", kind: "help", subject, message }) });
      const data = await res.json();
      if (!res.ok) { setNote(data.error || "The message could not be sent."); return; }
      setNote("Submitted.");
      setSubject("");
      setMessage("");
      const fresh = await fetch("/api/agent?part=plan").then((res) => res.json());
      setRows((fresh.requests || []).filter((item: { kind: string }) => item.kind === "help"));
    }}>
      <p className="eyebrow">Help</p>
      <h1>Help</h1>
      <p className="quiet">Questions come here. To feature a listing, advertise, or upgrade the free plan, use <a href="/agent/plan">Plan</a>. Payment is with the admin.</p>
      <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} required /></label>
      <label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} required /></label>
      <button className="btn" type="submit">Send</button>
      {note ? <p>{note}</p> : null}
      {rows.map((row) => <article className="panel" key={row.id}><p>{row.message}</p><p>{requestStatusLabel(row.status)}</p></article>)}
    </form>
  );
}
