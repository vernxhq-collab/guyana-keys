"use client";

import { useState } from "react";
import { PrivacyNote } from "../../../components/PrivacyNote";

export default function ApplyPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const res = await fetch("/api/agent-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        company: form.get("company"),
        areas: form.get("areas"),
        message: form.get("message"),
        website: form.get("website") || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error || "The application could not be sent.");
      return;
    }
    formEl.reset();
    setMessage("Sent. An admin reviews the application. This does not create a login, and nothing is public until the account is approved.");
  }

  return (
    <main className="wrap section">
      <h1>Apply to list</h1>
      <p>Free to list, no limits. The first five accounts an admin approves can carry a Founding agent badge. Do not send an ID image. A person reviews the application before any listing is public.</p>
      <form className="tool-form" onSubmit={(event) => void submit(event)}>
        <label>Name<input name="name" required autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Phone<input name="phone" required autoComplete="tel" /></label>
        <label>Company, if you have one<input name="company" autoComplete="organization" /></label>
        <label>Areas you list in<input name="areas" placeholder="Georgetown, East Bank, East Coast" /></label>
        <label>What you want to list<textarea name="message" /></label>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
        <PrivacyNote />
        <button className="btn" type="submit" disabled={busy}>{busy ? "Please wait..." : "Send application"}</button>
      </form>
      {message ? <p>{message}</p> : null}
      <p className="meta">Already have a login? <a href="/agent/login">Open the agent desk</a>.</p>
    </main>
  );
}
