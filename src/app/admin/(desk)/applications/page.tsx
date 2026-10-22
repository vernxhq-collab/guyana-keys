"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  areas: string;
  message: string;
  status: string;
  idChecked: boolean;
  licenceChecked: boolean;
  phoneChecked: boolean;
  referenceChecked: boolean;
  notes: string;
};

export default function ApplicationsPage() {
  const [rows, setRows] = useState<Application[] | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  function load() {
    fetch("/api/admin?part=applications")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data.error) setError(data.error || "Could not load applications.");
        else setRows(data.applications || []);
      })
      .catch(() => setError("Could not load applications."));
  }

  useEffect(() => { load(); }, []);

  async function save(event: React.FormEvent<HTMLFormElement>, status: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reviewApplication",
        id: String(form.get("id") || ""),
        status,
        idChecked: form.get("idChecked") === "on",
        licenceChecked: form.get("licenceChecked") === "on",
        phoneChecked: form.get("phoneChecked") === "on",
        referenceChecked: form.get("referenceChecked") === "on",
        notes: String(form.get("notes") || ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNote(data.error || "The application could not be saved.");
      return;
    }
    setNote("Saved. This record does not approve a login.");
    load();
  }

  if (error) return <p>{error}</p>;
  if (!rows) return <DeskSkeleton count={3} />;
  return (
    <div className="stack">
      <h1>Applications</h1>
      <p className="quiet">Record the checks here. Do not upload an ID image. Approving an application does not set the account to approved. After the person has a login, approve them on People.</p>
      {note ? <p>{note}</p> : null}
      {rows.length === 0 ? <p>No application yet.</p> : rows.map((row) => (
        <form className="panel" key={row.id} onSubmit={(event) => void save(event, String(new FormData(event.currentTarget).get("nextStatus") || row.status))}>
          <input type="hidden" name="id" value={row.id} />
          <strong>{row.name || "Applicant"}</strong>
          <p className="quiet">{[row.email, row.phone, row.company, row.areas].filter(Boolean).join(" · ")}</p>
          {row.message ? <p>{row.message}</p> : null}
          <p className="quiet">Status: {row.status}</p>
          <label><input type="checkbox" name="idChecked" defaultChecked={row.idChecked} /> ID checked, where an ID applies. Outcome only.</label>
          <label><input type="checkbox" name="licenceChecked" defaultChecked={row.licenceChecked} /> Licence or business registration checked, where it applies. Outcome only.</label>
          <label><input type="checkbox" name="phoneChecked" defaultChecked={row.phoneChecked} /> Phone checked.</label>
          <label><input type="checkbox" name="referenceChecked" defaultChecked={row.referenceChecked} /> A reference or a listing proof checked.</label>
          <label>Notes
            <textarea name="notes" defaultValue={row.notes} />
          </label>
          <div className="actions">
            <button className="btn ghost" type="submit" name="nextStatus" value={row.status}>Save checks</button>
            <button className="btn" type="submit" name="nextStatus" value="approved">Mark application approved</button>
            <button className="btn ghost" type="submit" name="nextStatus" value="declined">Mark declined</button>
          </div>
        </form>
      ))}
    </div>
  );
}
