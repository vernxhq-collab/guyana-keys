"use client";
import { useState } from "react";
import { PrivacyNote } from "../../components/PrivacyNote";

export default function DevelopersPage() {
  const [sent, setSent] = useState("");
  return (
    <main className="wrap section">
      <h1>Building a new scheme? Let&apos;s talk.</h1>
      <p>Tell us about your development and we&apos;ll be in touch about showing it to buyers here and abroad.</p>
      <form className="tool-form card" style={{ maxWidth: 520, padding: 22 }} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: "scheme", note: String(data.get("company") || "") + " · " + String(data.get("area") || "") }) });
        setSent(res.ok ? "Received. We will review the scheme before it is listed." : "Could not send. Try again.");
      }}>
        <label>Your name<input name="name" required autoComplete="name" /></label>
        <label>Developer or scheme name<input name="company" required autoComplete="organization" /></label>
        <label>Phone<input name="phone" required autoComplete="tel" /></label>
        <label>Area<input name="area" required placeholder="Providence or Ogle" /></label>
        <PrivacyNote />
        <button className="btn" type="submit">Submit</button>
      </form>
      {sent && <p>{sent}</p>}
    </main>
  );
}
