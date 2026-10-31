"use client";

import { useState } from "react";
import { decisionLabel, supportOutcome, type AgentOutcome } from "../lib/levels";

export function CheckOutcome({
  outcome,
  solo = false,
  onAppeal,
}: {
  outcome: AgentOutcome | null;
  solo?: boolean;
  onAppeal?: (statement: string) => Promise<string>;
}) {
  const [statement, setStatement] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const support = supportOutcome();
  const card = outcome && outcome.screen !== "none" ? outcome : null;

  async function appeal() {
    const text = statement.trim();
    if (text.length < 8) {
      setNote("Write what we should look at again.");
      return;
    }
    if (!onAppeal) {
      setNote("Sample preview. Nothing was sent. Thank you.");
      return;
    }
    setSending(true);
    const result = await onAppeal(text);
    setSending(false);
    setNote(result);
  }

  if (!card && solo) return null;
  return (
    <div className="stack">
      {card ? (
        <section className="panel stack">
          <h2>{card.title}</h2>
          {card.body.split("\n").filter((line) => line.length > 0).map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
          {card.screen === "not_approved" ? (
            <div className="stack">
              <label>What should we look at again?
                <textarea value={statement} onChange={(event) => setStatement(event.target.value)} />
              </label>
              <button className="btn" type="button" disabled={sending} onClick={() => void appeal()}>Appeal</button>
            </div>
          ) : null}
          {card.history.length > 0 ? (
            <div className="stack">
              <p className="quiet">What happened</p>
              {card.history.map((row) => (
                <p key={`${row.action}-${row.at}`} className="quiet">{decisionLabel(row.action) || "Update"} · {row.reason}</p>
              ))}
            </div>
          ) : null}
          {note ? <p>{note}</p> : null}
        </section>
      ) : null}
      {!solo && card?.screen !== "support" ? (
        <section className="panel stack">
          <h2>{support.title}</h2>
          <p>{support.body.replaceAll("\n\n", " ")}</p>
        </section>
      ) : null}
    </div>
  );
}
