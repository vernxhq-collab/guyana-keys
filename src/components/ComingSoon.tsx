"use client";

import Link from "next/link";
import { useState } from "react";

export function ComingSoon({
  heading = "New listings coming soon",
  line = "Be first to see them.",
}: {
  heading?: string;
  line?: string;
}) {
  const [sent, setSent] = useState("");

  return (
    <div className="empty-board">
      <div className="empty-copy">
        <h2>{heading}</h2>
        <p>{line}</p>
        <Link className="btn" href="/advertise">List your property</Link>
      </div>
      <form className="tool-form empty-form" onSubmit={async (event) => {
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
        <label className="field" htmlFor="alert-email">
          <span>Email</span>
          <input id="alert-email" name="email" type="email" required placeholder="Email" />
        </label>
        <label className="field" htmlFor="alert-area">
          <span>Area</span>
          <input id="alert-area" name="area" required placeholder="Area, such as Bel Air Park" />
        </label>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
        <button className="btn" type="submit">Create alert</button>
        {sent ? <p className="note empty-sent">{sent}</p> : null}
      </form>
    </div>
  );
}
