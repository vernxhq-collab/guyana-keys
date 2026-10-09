"use client";

import { useEffect, useState } from "react";
import { areas } from "../../../../lib/areas";
import { compressImage } from "../../../../lib/photos";

export default function AgentProfilePage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent?part=profile")
      .then((res) => res.json())
      .then((data) => {
        const profile = data.profile;
        if (!profile) { setNote(data.error || "Could not load the profile."); setLoading(false); return; }
        setName(profile.name || "");
        setCompany(profile.company || "");
        setPhone(profile.phone || "");
        setEmail(profile.email || "");
        setPhotoUrl(profile.photoUrl || "");
        setPicked(profile.areas || []);
        setLoading(false);
      })
      .catch(() => { setNote("Could not load the profile."); setLoading(false); });
  }, []);

  if (loading) return <p>Loading profile...</p>;
  return (
    <form className="stack" onSubmit={async (event) => {
      event.preventDefault();
      const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "profile", name, company, phone, areas: picked, photoUrl }) });
      const data = await res.json();
      setNote(res.ok ? "Saved." : data.error || "The profile could not be saved.");
    }}>
      <h1>Profile</h1>
      <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
      <label>Company<input value={company} onChange={(event) => setCompany(event.target.value)} /></label>
      <label>WhatsApp<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
      <label>Email<input value={email} readOnly /></label>
      {photoUrl ? <img src={photoUrl} alt="" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12 }} /> : null}
      <label>Photo
        <input type="file" accept="image/*" onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            const blob = await compressImage(file);
            const body = new FormData();
            body.set("file", new File([blob], "profile.jpg", { type: "image/jpeg" }));
            body.set("kind", "profile");
            const res = await fetch("/api/agent/photos", { method: "POST", body });
            const data = await res.json();
            if (!res.ok) setNote(data.error || "That photo could not be saved.");
            else setPhotoUrl(data.url);
          } catch {
            setNote("That photo could not be saved.");
          }
        }} />
      </label>
      <fieldset className="panel">
        <legend>Areas covered</legend>
        <div style={{ maxHeight: 240, overflow: "auto" }}>
          {areas.map((area) => (
            <label key={area.slug} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={picked.includes(area.name)} onChange={(event) => setPicked(event.target.checked ? [...picked, area.name] : picked.filter((item) => item !== area.name))} />
              {area.name}
            </label>
          ))}
        </div>
      </fieldset>
      <button className="btn" type="submit">Save</button>
      {note ? <p>{note}</p> : null}
    </form>
  );
}
