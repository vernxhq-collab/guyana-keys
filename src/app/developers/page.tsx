"use client";
import { useState } from "react";
export default function DevelopersPage() {
  const [sent, setSent] = useState("");
  return (
    <main className="wrap section">
      <h1>New schemes, meet buyers.</h1>
      <form className="card" style={{maxWidth:520, padding:22, display:"grid", gap:12}} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: "scheme", note: String(data.get("company") || "") + " · " + String(data.get("area") || "") }) });
        setSent(res.ok ? "Received. We will review the scheme before it is listed." : "Could not send. Try again.");
      }}>
        <input name="name" required placeholder="Your name" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="company" required placeholder="Developer or scheme name" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="phone" required placeholder="WhatsApp number" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="area" required placeholder="Area, such as Providence or Ogle" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <button className="btn" type="submit">Submit</button>
      </form>
      {sent && <p>{sent}</p>}
    </main>
  );
}
