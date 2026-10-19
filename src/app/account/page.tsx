"use client";

import { useEffect, useState } from "react";
import { BuyerDesk, type BuyerPayload } from "../../components/BuyerDesk";
import { DeskSkeleton } from "../../components/DeskSkeleton";
import { MagicLinkForm } from "../../components/MagicLinkForm";
import { SignOut } from "../../components/SignOut";

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
    if (auth.profile?.suspended) {
      setError("This account is suspended.");
      setPhase("refuse");
      return;
    }
    if (auth.profile?.role === "admin") {
      window.location.replace("/admin");
      return;
    }
    if (auth.profile?.role === "agent") {
      window.location.replace("/agent");
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
    void load();
  }, []);

  if (phase === "loading") return <main className="wrap section desk"><DeskSkeleton count={3} /></main>;
  if (phase === "refuse") return <main className="wrap section desk"><p>{error || "Your homes is for buyers."}</p><SignOut next="/account" /></main>;
  if (phase === "error") return <main className="wrap section desk"><p>{error || "Could not load your homes."}</p><button className="btn" type="button" onClick={() => void load()}>Try again</button></main>;
  if (phase === "in" && data) return <main className="wrap section desk"><BuyerDesk data={data} reload={async () => { await load(); }} /></main>;
  return (
    <main className="wrap section desk">
      {error ? <p>{error}</p> : null}
      <MagicLinkForm desk="buyer" title="Sign in or register" blurb="We email a sign-in link. Nothing is printed here." showName />
    </main>
  );
}
