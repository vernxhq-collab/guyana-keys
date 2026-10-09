"use client";
import { useState } from "react";
export default function AdvertiseListingPage() {
  const [sent, setSent] = useState("");
  return (
    <main className="wrap section">
      <h1>Advertise a listing</h1>
      <p className="sub">Contact us to feature a listing or upgrade a package. Payment is arranged with Guyana Keys before anything is featured or upgraded.</p>
      <form className="card" style={{maxWidth:520, padding:22, display:"grid", gap:12}} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: "featured", note: String(data.get("company") || "") + " · " + String(data.get("area") || "") }) });
        setSent(res.ok ? "Received. We will contact you about payment." : "Could not send. Try again.");
      }}>
        <input name="name" required placeholder="Your name" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="company" required placeholder="Agency or brand" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="phone" required placeholder="WhatsApp number" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="area" required placeholder="Listing or area to feature" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <button className="btn" type="submit">Contact us</button>
      </form>
      {sent && <p>{sent}</p>}
    </main>
  );
}
