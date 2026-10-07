"use client";

import { useEffect, useState } from "react";

type User = { id: string; name: string; email: string };
type Home = { id: string; title: string; area: string; purpose: string; priceGyd?: number; price_gyd?: number; beds?: number; baths?: number };

function money(home: Home) {
  const price = home.priceGyd ?? home.price_gyd ?? 0;
  const formatted = new Intl.NumberFormat("en-GY").format(price);
  return home.purpose === "Rent" ? `GYD ${formatted} / month` : `GYD ${formatted}`;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signup" | "login">("login");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [purpose, setPurpose] = useState("Sale");
  const [homes, setHomes] = useState<Home[]>([]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    if (!accessToken) {
      fetch("/api/auth").then((res) => res.json()).then((data) => setUser(data.user));
      return;
    }
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "session", accessToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else setError(data.error || "That sign-in link was not accepted.");
        window.history.replaceState({}, "", "/account");
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/listings").then((res) => res.json()).then((data) => setHomes(data.listings || []));
  }, [user]);

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", email, name: mode === "signup" ? name : undefined }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not send the email.");
      return;
    }
    setSentTo(data.email);
  }

  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", email: sentTo, code }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "That code was not accepted.");
      return;
    }
    setUser(data.user);
  }

  async function logOff() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    setUser(null);
    setSentTo("");
    setCode("");
  }

  if (user) {
    const shown = homes.filter((home) => !home.purpose || home.purpose === purpose);
    return (
      <main className="wrap section" style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>Your homes</h1>
          <button className="btn ghost" type="button" onClick={() => void logOff()}>Log off</button>
        </div>
        <p>Signed in as {user.name} \u00b7 {user.email}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={purpose === "Sale" ? "btn" : "btn ghost"} type="button" onClick={() => setPurpose("Sale")}>For sale</button>
          <button className={purpose === "Rent" ? "btn" : "btn ghost"} type="button" onClick={() => setPurpose("Rent")}>To rent</button>
        </div>
        {shown.map((home) => (
          <article className="card" key={home.id} style={{ padding: 16 }}>
            <strong>{money(home)}</strong>
            <p>{home.title}</p>
            <p>{home.area}</p>
          </article>
        ))}
      </main>
    );
  }

  return (
    <main className="wrap section" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <form className="card" style={{ width: "min(440px, 100%)", padding: 28, display: "grid", gap: 14 }} onSubmit={sentTo ? confirm : sendLink}>
        <h1 style={{ margin: 0, fontSize: 28 }}>{sentTo ? "Check your email" : "Sign in or register"}</h1>
        {sentTo ? (
          <>
            <p>Open the email and press the link. That signs you in. If the email also shows a 6-digit code, type it below.</p>
            <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="6-digit code, if the email has one" style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14 }} />
          </>
        ) : (
          <>
            <p>We email a sign-in link. Nothing is printed here.</p>
            {mode === "signup" ? (
              <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Your name" style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14 }} />
            ) : null}
            <label htmlFor="email"><strong>Enter your email address</strong></label>
            <input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required style={{ border: "1px solid #d5dbd8", borderRadius: 12, padding: 14 }} />
          </>
        )}
        {error ? <p>{error}</p> : null}
        <button className="btn" type="submit" disabled={busy || Boolean(sentTo && !code)} style={{ borderRadius: 999, padding: 14 }}>{busy ? "Please wait\u2026" : sentTo ? "Use code" : "Next"}</button>
        {!sentTo ? (
          <button className="btn ghost" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Create an account" : "I already have an account"}
          </button>
        ) : null}
      </form>
    </main>
  );
}
