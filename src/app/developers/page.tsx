"use client";
import { useState } from "react";
export default function DevelopersPage() {
  const [sent, setSent] = useState("");
  return (
    <main className="wrap section">
      <h1>New schemes, meet buyers.</h1>
      <p className="sub">List a development where people are already searching: East Bank, East Coast, and west of the river. It is reviewed before it is public.</p>
      <form className="search-card" style={{maxWidth:640, gridTemplateColumns:"1fr"}} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: "scheme", note: data.get("company") + " · " + data.get("area") }) });
        setSent(res.ok ? "Received. We will review the scheme before it is listed." : "Could not send. Try again.");
      }}>
        <input name="name" required placeholder="Your name" />
        <input name="company" required placeholder="Developer or scheme name" />
        <input name="phone" required placeholder="WhatsApp number" />
        <input name="area" required placeholder="Area, such as Providence or Ogle" />
        <button className="btn" type="submit">Submit</button>
      </form>
      {sent && <p>{sent}</p>}
    </main>
  );
}
