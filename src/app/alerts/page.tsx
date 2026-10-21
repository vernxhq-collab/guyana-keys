"use client";
import { useState } from "react";
import { deskEmail } from "../../lib/contact";
export default function AlertsPage() {
  const [sent, setSent] = useState("");
  return (
    <main className="wrap section">
      <h1>Create alert</h1>
      <p className="quiet">A match is emailed from {deskEmail}.</p>
      <form className="card" style={{maxWidth:520, padding:22, display:"grid", gap:12}} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const res = await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), area: data.get("area"), website: data.get("website") || "" }) });
        const payload = await res.json().catch(() => ({}));
        setSent(!res.ok
          ? payload.error || "Could not save the alert."
          : payload.step === "saved"
            ? "Alert saved. We will email you when a home in that area is listed."
            : payload.step === "paused"
              ? "Alert saved. Confirm email is not connected yet, so this alert stays paused until you confirm it."
              : "Check that email and confirm the alert. Nothing is sent until you confirm.");
      }}>
        <input name="email" type="email" required placeholder="Email" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="area" required placeholder="Area, such as Bel Air Park" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
        <button className="btn" type="submit">Create alert</button>
      </form>
      {sent && <p>{sent}</p>}
    </main>
  );
}
