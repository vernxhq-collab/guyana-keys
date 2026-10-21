"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "./DeskSkeleton";

type Message = { id: string; channel: string; body: string; status: string };

export function OutboxDesk() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agent?part=outbox")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => { if (!ok) setError(data.error || "Could not load the outbox."); else setMessages(data.messages || []); })
      .catch(() => setError("Could not load the outbox."));
  }, []);

  if (error) return <p>{error}</p>;
  if (!messages) return <DeskSkeleton count={2} />;

  return (
    <div className="stack">
      <p className="eyebrow">Outbox</p>
      <h1>Held messages</h1>
      <p className="quiet">WhatsApp and email stop here. Nothing is delivered from this preview.</p>
      {messages.length === 0 ? <p>Nothing is held.</p> : messages.map((item) => (
        <article className="panel" key={item.id}><strong>{item.channel} · {item.status}</strong><p>{item.body}</p></article>
      ))}
    </div>
  );
}
