"use client";
import { useState } from "react";
export default function AlertsPage() {
  const [sent, setSent] = useState("");
  return (
    <main className="wrap section">
      <h1>Create alert</h1>
      <form className="card" style={{maxWidth:520, padding:22, display:"grid", gap:12}} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const res = await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), area: data.get("area") }) });
        setSent(res.ok ? "Alert saved." : "Could not save the alert.");
      }}>
        <input name="email" type="email" required placeholder="Email" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="area" required placeholder="Area, such as Bel Air or Ogle" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <button className="btn" type="submit">Create alert</button>
      </form>
      {sent && <p>{sent}</p>}
    </main>
  );
}
