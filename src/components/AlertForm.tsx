"use client";

import { useState } from "react";
import { PrivacyNote } from "./PrivacyNote";

export function AlertForm() {
  const [sent, setSent] = useState("");

  return (
    <form className="tool-form home-alert" onSubmit={async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), area: data.get("area"), website: data.get("website") || "" }),
      });
      const payload = await res.json().catch(() => ({}));
      setSent(!res.ok
        ? payload.error || "Could not save the alert."
        : payload.step === "saved"
          ? "Alert saved. We will email you when a home in that area is listed."
          : payload.step === "paused"
            ? "Alert saved. Confirm email is not connected yet, so this alert stays paused until you confirm it."
            : "Check that email and confirm the alert. Nothing is sent until you confirm.");
    }}>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field">
        <span>Area</span>
        <input name="area" required placeholder="Bel Air Park" />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <PrivacyNote />
      <button className="btn" type="submit">Create alert</button>
      {sent ? <p className="note">{sent}</p> : null}
    </form>
  );
}
