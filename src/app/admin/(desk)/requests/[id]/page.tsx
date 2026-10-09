"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type RequestView = { id: string; kind: string; status: string; statusLabel: string; instructions: string; message: string; agent: string; company: string; listing: string; line: string };

export default function RequestPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<RequestView | null>(null);
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  function load() {
    return fetch(`/api/admin?part=request&id=${params.id}`).then(async (res) => ({ ok: res.ok, data: await res.json() })).then(({ ok, data }) => {
      if (!ok || data.error) setError(data.error || "Could not load this request.");
      else { setItem(data.request); setInstructions(data.request.instructions || ""); }
    }).catch(() => setError("Could not load this request."));
  }
  useEffect(() => { void load(); }, [params.id]);

  async function act(action: string) {
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id: params.id, instructions }) });
    const data = await res.json();
    setNote(res.ok ? "Saved." : data.error || "That could not be saved.");
    if (res.ok) await load();
  }

  if (error) return <p>{error}</p>;
  if (!item) return <p>Loading the request...</p>;
  const finished = item.status === "paid" || item.status === "on" || item.status === "done";
  return (
    <div className="stack">
      <h1>{item.agent}</h1>
      <p>{item.line}</p>
      <p className="quiet">{item.company} · {item.statusLabel}</p>
      {item.listing ? <p>Listing: {item.listing}</p> : null}
      {item.message ? <p>{item.message}</p> : null}
      {item.kind === "help" ? (
        finished ? <p>Done</p> : <button className="btn" type="button" onClick={() => void act("paid")}>Mark done</button>
      ) : (
        <>
          <label>Payment instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} /></label>
          {finished ? null : <button className="btn" type="button" onClick={() => void act("instructions")}>Save instructions</button>}
          {finished ? <p>{item.statusLabel}</p> : <button className="btn ghost" type="button" onClick={() => void act("paid")}>Mark paid</button>}
        </>
      )}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
