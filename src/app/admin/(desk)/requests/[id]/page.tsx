"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DeskSkeleton } from "../../../../../components/DeskSkeleton";
import { whenLabel } from "../../../../../lib/assist";
import { money } from "../../../../../lib/data";
import { requestKindLabel } from "../../../../../lib/labels";

type RequestView = { id: string; kind: string; status: string; statusLabel: string; instructions: string; message: string; agent: string; company: string; listing: string; line: string; amountGyd: number; paidAt: string; paidBy: string };

export default function RequestPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<RequestView | null>(null);
  const [instructions, setInstructions] = useState("");
  const [amount, setAmount] = useState("");
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
    const amountGyd = Number(String(amount).replace(/[^\d]/g, ""));
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id: params.id, instructions, amountGyd }) });
    const data = await res.json();
    setNote(res.ok ? "Saved." : data.error || "That could not be saved.");
    if (res.ok) await load();
  }

  if (error) return <p>{error}</p>;
  if (!item) return <DeskSkeleton count={2} />;
  const finished = item.status === "paid" || item.status === "on" || item.status === "done";
  const paidLabel = item.kind === "feature" ? "Mark paid and feature" : item.kind === "advertise" ? "Mark paid" : "Mark paid";
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
          {finished ? (
            <p>{item.amountGyd > 0 ? `Receipt: ${money(item.amountGyd, "Sale")}${item.paidAt ? ` · ${whenLabel(item.paidAt)}` : ""}${item.paidBy ? ` · marked by ${item.paidBy}` : ""}` : item.statusLabel}</p>
          ) : (
            <div className="stack">
              <label>Amount received, GYD
                <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" placeholder="450000" />
              </label>
              <div className="actions">
                <button className="btn" type="button" onClick={() => void act("instructions")}>Send payment instructions</button>
                <button className="btn ghost" type="button" onClick={() => void act("paid")}>{paidLabel}</button>
              </div>
            </div>
          )}
          {finished ? null : <p className="quiet">{item.kind === "feature" ? "Mark paid only after the payment arrives. The listing is then featured." : "Mark paid only after the payment arrives. Listings stay free."}</p>}
        </>
      )}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
