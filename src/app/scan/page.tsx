"use client";

import { useEffect, useState } from "react";
import { PhoneScan } from "../../components/PhoneScan";
import { ID_CONSENT_VERSION } from "../../lib/compliance/retention";

export default function ScanPage() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = window.location.hash.startsWith("#t=") ? decodeURIComponent(window.location.hash.slice(3)) : "";
    setToken(raw);
    fetch("/api/scan")
      .then((res) => setReady(res.ok))
      .catch(() => setReady(false));
  }, []);

  async function claim() {
    setBusy(true);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim", token }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setNote(data.error || "This phone link is not valid.");
      return;
    }
    window.history.replaceState(null, "", "/scan");
    setToken("");
    setReady(true);
  }

  if (ready) return <PhoneScan phone consentVersion={ID_CONSENT_VERSION} />;
  return (
    <section className="stack">
      <h1>Keys Check on this phone</h1>
      <p>This link only opens the photo steps. It is not a sign-in to the rest of the desk.</p>
      {token ? <button className="btn" type="button" disabled={busy} onClick={() => void claim()}>Continue on this phone</button> : <p>Open the link from the code on your other screen.</p>}
      {note ? <p>{note}</p> : null}
    </section>
  );
}
