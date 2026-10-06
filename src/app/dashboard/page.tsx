"use client";
import { useState } from "react";
export default function DashboardPage() {
  const [draft, setDraft] = useState<{ title?: string; description?: string; missing?: string[]; purpose?: string; type?: string; area?: string; price?: string } | null>(null);
  const [reply, setReply] = useState("");
  const [lease, setLease] = useState("");
  return (
    <main className="wrap section">
      <h1>Desk</h1>
      <h2>Application</h2>
      <form className="card" style={{maxWidth:560, padding:22, display:"grid", gap:12}} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: "rental-application", note: [data.get("property"), data.get("idType"), data.get("idRef"), data.get("addressProof")].join(" · ") }) });
        if (!res.ok) return;
        setLease(`${data.get("name")} applies to rent ${data.get("property")}. Rent is payable monthly in GYD. The tenancy starts only after you accept and both parties sign.`);
      }}>
        <input name="name" required placeholder="Applicant name" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="phone" required placeholder="WhatsApp number" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="property" required placeholder="Property" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <h2>Documents for review</h2>
        <select name="idType" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}}><option>Passport</option><option>National ID</option><option>Driver's licence</option></select>
        <input name="idRef" required placeholder="Document reference" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="addressProof" required placeholder="Proof of address" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <button className="btn" type="submit">Save application</button>
      </form>
      {lease && <article className="card" style={{maxWidth:560, marginTop:16}}><div className="card-body"><h2>Lease draft</h2><p>{lease}</p></div></article>}
      <h2>Listing draft</h2>
      <form className="card" style={{maxWidth:560, padding:22, display:"grid", gap:12}} onSubmit={async (event) => { event.preventDefault(); const notes = String(new FormData(event.currentTarget).get("notes") || ""); setDraft(await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) }).then((res) => res.json())); }}>
        <textarea name="notes" required placeholder="3 bed house in Bel Air, 95 million" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <button className="btn" type="submit">Draft listing</button>
      </form>
      {draft && <p>{draft.title}. {draft.description}</p>}
      <h2>Reply draft</h2>
      <form className="card" style={{maxWidth:560, padding:22, display:"grid", gap:12}} onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const body = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "reply", name: data.get("name"), listing: data.get("listing") }) }).then((res) => res.json()); setReply(body.reply); }}>
        <input name="name" required placeholder="Buyer name" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="listing" required placeholder="Listing" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <button className="btn" type="submit">Draft reply</button>
      </form>
      {reply && <p>{reply}</p>}
    </main>
  );
}
