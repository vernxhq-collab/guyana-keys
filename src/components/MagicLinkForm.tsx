"use client";

import { useState } from "react";

export function MagicLinkForm({ desk, title, blurb, showName = false }: { desk: "buyer" | "agent" | "admin"; title: string; blurb: string; showName?: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", email, desk, name: showName && mode === "signup" ? name : undefined }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not send the email.");
      return;
    }
    setSent(data.email || email);
  }

  return (
    <form className="card" style={{ width: "min(440px, 100%)", margin: "0 auto", padding: 28, display: "grid", gap: 14 }} onSubmit={sendLink}>
      <h1 style={{ margin: 0, fontSize: 28 }}>{sent ? "Check your email" : title}</h1>
      {sent ? (
        <p>Open the link in the email. It signs you in. Nothing else is shown here.</p>
      ) : (
        <>
          <p>{blurb}</p>
          {showName && mode === "signup" ? <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your name" style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14 }} /> : null}
          <label htmlFor="email"><strong>Enter your email address</strong></label>
          <input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14 }} />
        </>
      )}
      {error ? <p>{error}</p> : null}
      {sent ? (
        <button className="btn ghost" type="button" onClick={() => { setSent(""); setError(""); }}>Use a different email</button>
      ) : (
        <button className="btn" type="submit" disabled={busy} style={{ borderRadius: 999, padding: 14 }}>{busy ? "Please wait..." : "Next"}</button>
      )}
      {showName && !sent ? (
        <button className="btn ghost" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Create an account" : "I already have an account"}
        </button>
      ) : null}
    </form>
  );
}
