"use client";

import { useEffect, useState } from "react";

// Second sign-in step for reviewers. Uses any authenticator app that shows 6-digit codes.
export function TwoStep() {
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/mfa")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setNote(data.error);
        setEnrolled(Boolean(data.enrolled));
      })
      .catch(() => setNote("Two-step sign-in could not be checked."));
  }, []);

  async function call(body: Record<string, string>) {
    setBusy(true);
    setNote("");
    const res = await fetch("/api/auth/mfa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    return { ok: res.ok, data };
  }

  async function start() {
    const { ok, data } = await call({ action: "start" });
    if (!ok) return setNote(data.error || "Two-step sign-in could not be set up.");
    if (data.enrolled) return setEnrolled(true);
    setFactorId(data.factorId || "");
    setQr(data.qr || "");
    setSecret(data.secret || "");
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    const { ok, data } = await call({ action: "verify", factorId, code });
    if (!ok) return setNote(data.error || "That code did not work.");
    window.location.reload();
  }

  return (
    <div className="panel stack">
      <h1>Two-step sign-in</h1>
      <p>The review desk holds ID files, so it needs a second step: a 6-digit code from an authenticator app on your phone.</p>
      {enrolled === false && !qr ? (
        <>
          <p className="quiet">First time here. Set up a code app once, then use it each time you sign in.</p>
          <button className="btn" type="button" disabled={busy} onClick={() => void start()}>Set up two-step sign-in</button>
        </>
      ) : null}
      {qr ? (
        <div className="stack">
          <p>Scan this with an authenticator app, then enter the code it shows.</p>
          <img src={qr} alt="QR code for the authenticator app" width={200} height={200} />
          <details>
            <summary>Cannot scan? Type a set-up key instead</summary>
            <input type="password" readOnly value={secret} aria-label="Set-up key" onFocus={(event) => { event.currentTarget.type = "text"; }} />
          </details>
        </div>
      ) : null}
      {enrolled || qr ? (
        <form className="stack" onSubmit={(event) => void verify(event)}>
          <label>
            6-digit code
            <input inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} />
          </label>
          <button className="btn" type="submit" disabled={busy || code.length !== 6}>Continue</button>
        </form>
      ) : null}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
