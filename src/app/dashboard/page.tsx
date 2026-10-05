"use client";
import { useState } from "react";
export default function DashboardPage() {
  const [draft, setDraft] = useState<{ title?: string; description?: string; missing?: string[]; purpose?: string; type?: string; area?: string; price?: string } | null>(null);
  const [reply, setReply] = useState("");
  return (
    <main className="wrap section">
      <h1>Agent desk</h1>
      <p className="sub">Drafts stay here until you approve them. Nothing is sent.</p>
      <h2>Listing draft</h2>
      <form className="search-card" onSubmit={async (event) => { event.preventDefault(); const notes = String(new FormData(event.currentTarget).get("notes") || ""); const data = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) }).then((res) => res.json()); setDraft(data); }}>
        <textarea name="notes" required placeholder="3 bed house in Bel Air, 95 million, gated, transport available" />
        <button className="btn" type="submit">Draft listing</button>
      </form>
      {draft && <article className="card"><div className="card-body"><span className="chip">Draft</span><h2>{draft.title}</h2><p>{draft.description}</p><p className="meta">{draft.purpose} · {draft.type} · {draft.area || "area missing"} · {draft.price || "price missing"}</p>{draft.missing?.length ? <p>Still needed: {draft.missing.join(", ")}</p> : <p>Ready for approval. It is not live.</p>}</div></article>}
      <h2>Reply draft</h2>
      <form className="search-card" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const body = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "reply", name: data.get("name"), listing: data.get("listing") }) }).then((res) => res.json()); setReply(body.reply); }}>
        <input name="name" required placeholder="Buyer name" /><input name="listing" required placeholder="Listing" /><button className="btn" type="submit">Draft reply</button>
      </form>
      {reply && <p>{reply}</p>}
    </main>
  );
}
