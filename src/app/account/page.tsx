"use client";

import { useEffect, useState } from "react";
import { BuyerDesk, type BuyerPayload } from "../../components/BuyerDesk";
import { MagicLinkForm } from "../../components/MagicLinkForm";

export default function AccountPage() {
  const [phase, setPhase] = useState<"loading" | "out" | "in" | "refuse" | "error">("loading");
  const [data, setData] = useState<BuyerPayload | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const auth = await fetch("/api/auth").then((res) => res.json());
    if (!auth.user) {
      setPhase("out");
      return;
    }
    if (auth.profile && auth.profile.role !== "buyer") {
      setPhase("refuse");
      return;
    }
    const key = "gk-mine-" + auth.user.id;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const mine = JSON.parse(raw) as { saved?: string[]; enquired?: string[] };
        const moved = await fetch("/api/buyer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "migrate", saved: mine.saved || [], enquired: mine.enquired || [] }) });
        if (moved.ok) localStorage.removeItem(key);
      } catch {
        // Leave the browser copy in place so the next visit can try again.
      }
    }
    const res = await fetch("/api/buyer");
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error || "Could not load your homes.");
      setPhase(res.status === 403 ? "refuse" : "error");
      return;
    }
    setData(payload);
    setPhase("in");
  }

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    if (!accessToken) {
      void load();
      return;
    }
    fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "session", accessToken, desk: "buyer" }) })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data: body }) => {
        window.history.replaceState({}, "", "/account");
        if (!ok) {
          setError(body.error || "That sign-in link was not accepted.");
          setPhase("out");
          return;
        }
        return load();
      })
      .catch(() => {
        setError("That sign-in link was not accepted.");
        setPhase("out");
      });
  }, []);

  if (phase === "loading") return <main className="wrap section desk"><p>Loading your homes...</p></main>;
  if (phase === "refuse") return <main className="wrap section desk"><p>Your homes is for buyers.</p></main>;
  if (phase === "error") return <main className="wrap section desk"><p>{error || "Could not load your homes."}</p><button className="btn" type="button" onClick={() => void load()}>Try again</button></main>;
  if (phase === "in" && data) return <main className="wrap section desk"><BuyerDesk data={data} reload={async () => { await load(); }} /></main>;
  return (
    <main className="wrap section desk">
      {error ? <p>{error}</p> : null}
      <MagicLinkForm desk="buyer" title="Sign in or register" blurb="We email a sign-in link. Nothing is printed here." showName />
    </main>
  );
}
