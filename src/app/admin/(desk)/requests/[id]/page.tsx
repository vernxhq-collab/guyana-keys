"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DeskSkeleton } from "../../../../../components/DeskSkeleton";
import { requestKindLabel } from "../../../../../lib/labels";

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
  if (!item) return <DeskSkeleton count={2} />;
  const finished = item.status === "paid" || item.status === "on" || item.status === "done";
  const paidLabel = item.kind === "plan" ? "Mark paid and upgrade" : "Mark paid and feature";
  return (
    <div className="stack">
      <h1>{item.agent}</h1>
      <p className="quiet">{requestKindLabel(item.kind)}{item.company ? ` · ${item.company}` : ""} · {item.statusLabel}</p>
      <p className="ai-bar next"><span>{item.line}</span></p>
      {item.listing ? <p>Listing: {item.listing}</p> : null}
      {item.message ? <p>{item.message}</p> : null}
      {item.kind === "help" ? (
        finished ? <p>Done</p> : <button className="btn" type="button" onClick={() => void act("paid")}>Mark done</button>
      ) : (
        <>
          <p className="quiet">Payment happens with you, outside this desk. The agent sees these instructions on Plan and pays you directly.</p>
          <label>Payment instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} /></label>
          {finished ? <p>{item.statusLabel}</p> : (
            <div className="actions">
              <button className="btn" type="button" onClick={() => void act("instructions")}>Send payment instructions</button>
              <button className="btn ghost" type="button" onClick={() => void act("paid")}>{paidLabel}</button>
            </div>
          )}
          {finished ? null : <p className="quiet">{item.kind === "plan" ? "Mark paid only after the payment arrives. The plan becomes agency and the cap becomes 20." : "Mark paid only after the payment arrives. The listing is then featured."}</p>}
        </>
      )}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
