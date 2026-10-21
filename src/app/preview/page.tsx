"use client";

import { useEffect, useState } from "react";

type Enquiry = { id: string; home: string; area: string; note: string; reply: string; viewingAt: string | null; viewingRequest: string | null; stage: string };
type Actor = { id: string; name: string; kind: string; agency: string };

export default function PreviewPage() {
  const [actor, setActor] = useState<Actor | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/preview");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "This preview is closed.");
      return;
    }
    setActor(data.actor);
    setEnquiries(data.buyer?.enquiries || []);
  }

  useEffect(() => { void load(); }, []);

  async function enter(id: string) {
    const res = await fetch("/api/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "enter", actor: id }) });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not open the test desk.");
      return;
    }
    if (id === "maria") {
      await load();
      return;
    }
    window.location.href = "/agent";
  }

  return (
    <main className="wrap section">
      <p className="eyebrow">Preview only</p>
      <h1>Phase 2 test desk</h1>
      <p className="sub">Isolated records. Sign-in email is off. Nothing here is written to the live database, and no WhatsApp or email is sent.</p>
      {error ? <p>{error}</p> : null}
      <div className="actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0" }}>
        <button className="btn" type="button" onClick={() => void enter("asha")}>Open as Asha, Demerara Homes</button>
        <button className="btn ghost" type="button" onClick={() => void enter("ravi")}>Open as Ravi, same agency</button>
        <button className="btn ghost" type="button" onClick={() => void enter("jon")}>Open as Jon, Berbice Estates</button>
        <button className="btn ghost" type="button" onClick={() => void enter("maria")}>View as Maria, the buyer</button>
        <button className="btn ghost" type="button" onClick={async () => { await fetch("/api/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset", actor: actor?.id || "asha" }) }); await load(); }}>Reset test data</button>
      </div>
      {actor?.kind === "buyer" ? (
        <section className="stack">
          <h2>{actor.name}</h2>
          <p className="sub">This is what the buyer sees after the agent replies.</p>
          {enquiries.length === 0 ? <p>No enquiry yet.</p> : enquiries.map((item) => (
            <article className="card" key={item.id}><div className="card-body">
              <strong>{item.home}</strong>
              <p className="meta">{item.area} · {item.stage}</p>
              <p>{item.note}</p>
              <p>{item.reply ? `Agent: ${item.reply}` : "The agent has not replied yet."}</p>
              <p>{item.viewingAt ? `Viewing set: ${new Date(item.viewingAt).toLocaleString("en-GY", { timeZone: "America/Guyana" })}` : item.viewingRequest ? `You asked for ${item.viewingRequest}.` : "No viewing yet."}</p>
            </div></article>
          ))}
        </section>
      ) : actor ? <p className="sub">Signed in to the test as {actor.name}{actor.agency ? `, ${actor.agency}` : ""}. Open the agent desk from the button above.</p> : <p className="sub">Choose a test person. Asha should see Maria. Jon should not.</p>}
    </main>
  );
}
