"use client";
import { useState } from "react";
export default function AdvertiseListingPage() {
  const [sent, setSent] = useState("");
  return (
    <main className="wrap section">
      <h1>Advertise a listing</h1>
      <p className="sub">Listings are free. Contact us to feature a listing or advertise. Payment is arranged with Guyana Keys before anything is featured or advertised.</p>
      <form className="card" style={{maxWidth:520, padding:22, display:"grid", gap:12}} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const details = [
          data.get("generator") ? `Generator: ${data.get("generator")}` : "",
          data.get("waterTank") ? `Water tank: ${data.get("waterTank")}` : "",
          data.get("waterNotes") ? `Water notes: ${data.get("waterNotes")}` : "",
          data.get("parking") ? `Parking: ${data.get("parking")}` : "",
          data.get("parkingSpaces") ? `Parking spaces: ${data.get("parkingSpaces")}` : "",
          data.get("floodRisk") ? `Flooding as reported by the lister: ${data.get("floodRisk")}` : "",
          data.get("furnished") ? `Furnished: ${data.get("furnished")}` : "",
        ].filter(Boolean).join(" · ");
        const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: "featured", note: [String(data.get("company") || ""), String(data.get("area") || ""), details].filter(Boolean).join(" · ") }) });
        setSent(res.ok ? "Received. We will contact you about payment." : "Could not send. Try again.");
      }}>
        <input name="name" required placeholder="Your name" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="company" required placeholder="Agency or brand" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="phone" required placeholder="WhatsApp number" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="area" required placeholder="Listing or area to feature" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <label>Generator, optional
          <select name="generator" defaultValue="" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14, width:"100%"}}>
            <option value="">Not set</option><option value="yes">Yes</option><option value="no">No</option><option value="unknown">Not stated</option>
          </select>
        </label>
        <label>Water tank, optional
          <select name="waterTank" defaultValue="" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14, width:"100%"}}>
            <option value="">Not set</option><option value="yes">Yes</option><option value="no">No</option>
          </select>
        </label>
        <input name="waterNotes" placeholder="Water notes, optional" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <label>Parking, optional
          <select name="parking" defaultValue="" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14, width:"100%"}}>
            <option value="">Not set</option><option value="none">None</option><option value="street">Street</option><option value="yard">Yard</option><option value="garage">Garage</option>
          </select>
        </label>
        <input name="parkingSpaces" placeholder="Parking spaces, optional" inputMode="numeric" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <label>Flooding risk, as reported by the lister
          <select name="floodRisk" defaultValue="" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14, width:"100%"}}>
            <option value="">Not set</option><option value="low">Low</option><option value="some">Some</option><option value="high">High</option><option value="unknown">Not stated</option>
          </select>
        </label>
        <label>Furnished, optional
          <select name="furnished" defaultValue="" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14, width:"100%"}}>
            <option value="">Not set</option><option value="unfurnished">Unfurnished</option><option value="partly">Partly furnished</option><option value="furnished">Furnished</option><option value="unknown">Not stated</option>
          </select>
        </label>
        <button className="btn" type="submit">Contact us</button>
      </form>
      {sent && <p>{sent}</p>}
    </main>
  );
}
