"use client";
import { useState } from "react";
export default function LandlordsPage() {
  const [sent, setSent] = useState("");
  const [lease, setLease] = useState("");
  return (
    <main className="wrap section">
      <h1>Landlord desk</h1>
      <form className="card" style={{maxWidth:560, padding:22, display:"grid", gap:12}} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const note = ["application", data.get("property"), data.get("idType"), data.get("idRef"), data.get("addressProof")].join(" · ");
        const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), listingId: "rental-application", note }) });
        if (!res.ok) { setSent("Could not save the application."); return; }
        setSent("Application received. Identity documents are for review, not an automatic clearance.");
        setLease(`${data.get("name")} applies to rent ${data.get("property")}. Rent is payable monthly in GYD. The tenancy starts only after the landlord accepts and both parties sign. A listing is not proof of title.`);
      }}>
        <h2>Application</h2>
        <input name="name" required placeholder="Applicant name" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="phone" required placeholder="WhatsApp number" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="property" required placeholder="Property, such as Ogle apartment" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <h2>Identity check</h2>
        <select name="idType" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}}><option>Passport</option><option>National ID</option><option>Driver's licence</option></select>
        <input name="idRef" required placeholder="Document reference" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <input name="addressProof" required placeholder="Proof of address, such as a utility bill" style={{border:"1px solid #d5dbd8", borderRadius:10, padding:14}} />
        <button className="btn" type="submit">Submit application</button>
      </form>
      {sent && <p>{sent}</p>}
      {lease && <article className="card" style={{maxWidth:560, marginTop:16}}><div className="card-body"><h2>Lease draft</h2><p>{lease}</p><p className="meta">Not signed. Send it on WhatsApp after you accept the application.</p></div></article>}
    </main>
  );
}
