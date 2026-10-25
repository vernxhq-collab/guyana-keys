"use client";

import { useState } from "react";
import { PrivacyNote } from "./PrivacyNote";
import { pageAttribution } from "../lib/page-context";

export function LeadForm({ propertyId, preset, button, leadKind = "enquiry", partnerId = "", sample = false }: { propertyId?: string; preset: string; button: string; leadKind?: "enquiry" | "title_check" | "intro"; partnerId?: string; sample?: boolean }) {
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sample) {
      setSent("Sample preview. This does not send a lead.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const message = String(data.get("note") || "").trim();
    setBusy(true);
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: propertyId || "",
        name: data.get("name"),
        phone: data.get("phone"),
        note: message ? `${preset} — ${message}` : preset,
        website: data.get("website") || "",
        ...pageAttribution({ leadKind, partnerId }),
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    setSent(res.ok ? "Sent. This is saved as a Guyana Keys lead." : body.error || "The lead could not be saved.");
  }

  return (
    <form className="tool-form" onSubmit={(event) => void submit(event)}>
      <input name="name" required placeholder="Your name" />
      <input name="phone" required placeholder="Phone" autoComplete="tel" />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      <input name="note" placeholder="Message (optional)" />
      <PrivacyNote />
      <button className="btn" type="submit" disabled={busy}>{button}</button>
      {sent ? <p>{sent}</p> : null}
    </form>
  );
}
