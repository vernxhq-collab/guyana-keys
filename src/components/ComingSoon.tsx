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
    <div className="panel" style={{ maxWidth: 560 }}>
      <h2>{heading}</h2>
      <p>{line}</p>
      <form className="tool-form" onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const res = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.get("email"), area: data.get("area") }),
        });
        const payload = await res.json().catch(() => ({}));
        setSent(res.ok ? "Alert saved. Email goes out when email is connected." : payload.error || "Could not save the alert.");
      }}>
        <input name="email" type="email" required placeholder="Email" />
        <input name="area" required placeholder="Area, such as Bel Air Park" />
        <button className="btn" type="submit">Create alert</button>
      </form>
      {sent ? <p>{sent}</p> : null}
      <p><Link className="btn" href="/advertise">List your property</Link></p>
    </div>
  );
}
