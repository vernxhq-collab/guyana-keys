"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";
import { idConsentText } from "../../../../lib/compliance/retention";
import { LICENCE_TYPES, licenceLabel } from "../../../../lib/licences";

type Licence = {
  type: string;
  label: string;
  issuingBody: string;
  number: string;
  issueDate: string;
  expiry: string;
  status: string;
  notes: string;
};

type DocumentRow = { id: string; kind: string; createdAt: string; deletedAt: string; consentVersion: string };

export default function ChecksPage() {
  const [ready, setReady] = useState(true);
  const [licences, setLicences] = useState<Licence[] | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [identity, setIdentity] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentVersion, setConsentVersion] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/agent?part=checks")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data.error) setError(data.error || "Could not load checks.");
        else {
          setReady(data.ready !== false);
          setLicences(data.licences || []);
          setDocuments(data.documents || []);
          setIdentity(data.identity?.status || "not submitted");
          setConsentVersion(data.consentVersion || "");
        }
      })
      .catch(() => setError("Could not load checks."));
  }

  useEffect(() => { load(); }, []);

  async function saveLicence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveLicence",
        licenceType: form.get("licenceType"),
        issuingBody: form.get("issuingBody"),
        licenceNumber: form.get("licenceNumber"),
        issueDate: form.get("issueDate"),
        expiryDate: form.get("expiryDate"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setNote(res.ok ? "Submitted for a check. You cannot mark it checked." : data.error || "The licence could not be saved.");
    if (res.ok) load();
  }

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = new FormData(event.currentTarget);
    body.set("consent", consent ? "yes" : "");
    body.set("consentVersion", consentVersion);
    const res = await fetch("/api/agent/identity", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setNote(res.ok ? "Stored in the private bucket. There is no public link." : data.error || "The file could not be saved.");
    if (res.ok) load();
  }

  async function askDelete(id: string) {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "requestDeletion", documentId: id }),
    });
    const data = await res.json().catch(() => ({}));
    setNote(res.ok ? "Deletion requested. An admin has to carry it out." : data.error || "The request could not be saved.");
  }

  if (error) return <p>{error}</p>;
  if (!licences) return <DeskSkeleton count={3} />;
  return (
    <div className="stack">
      <h1>Checks</h1>
      <p className="quiet">Submit a licence for Guyana Keys to check. The public line names exactly what was checked. It never says only “Verified”.</p>
      {!ready ? <p>Licence checks are not ready on this desk yet.</p> : null}
      {note ? <p>{note}</p> : null}
      <p className="quiet">ID check status: {identity}. A selfie does not start a liveness check. No provider is connected.</p>
      {LICENCE_TYPES.map((type) => {
        const current = licences.find((item) => item.type === type);
        return (
          <form className="panel tool-form" key={type} onSubmit={(event) => void saveLicence(event)}>
            <strong>{licenceLabel(type)}</strong>
            {type === "reaba_professional" ? <p className="quiet">This is the Guyana Real Estate Agents Authority licence under the Real Estate Agents and Brokers Act 2023.</p> : null}
            <p className="quiet">Status: {current?.status || "not submitted"}{current?.notes ? ` · ${current.notes}` : ""}</p>
            <input type="hidden" name="licenceType" value={type} />
            <label>Issuing body<input name="issuingBody" defaultValue={current?.issuingBody || ""} /></label>
            <label>Licence number<input name="licenceNumber" required defaultValue={current?.number || ""} /></label>
            <label>Issue date<input name="issueDate" type="date" defaultValue={current?.issueDate || ""} /></label>
            <label>Expiry date<input name="expiryDate" type="date" defaultValue={current?.expiry || ""} /></label>
            <button className="btn" type="submit">Submit for a check</button>
          </form>
        );
      })}
      <form className="panel tool-form" onSubmit={(event) => void upload(event)}>
        <h2>Identity file</h2>
        <p>{idConsentText}</p>
        <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I have read this and I agree to this version ({consentVersion || "not loaded"}).</label>
        <label>File
          <input name="file" type="file" accept="image/jpeg,image/png,application/pdf" required disabled={!consent} />
        </label>
        <label>Kind
          <select name="kind" defaultValue="id_scan" disabled={!consent}>
            <option value="id_scan">ID scan</option>
            <option value="selfie">Selfie file only. No liveness check.</option>
          </select>
        </label>
        <button className="btn" type="submit" disabled={!consent}>Store in the private bucket</button>
      </form>
      {documents.length === 0 ? <p className="quiet">No identity file stored.</p> : documents.map((row) => (
        <p className="quiet-row" key={row.id}>
          <span>{row.kind === "selfie" ? "Selfie" : "ID scan"} · {row.deletedAt ? "Deleted" : "Stored"} · consent {row.consentVersion}</span>
          {row.deletedAt ? null : <button className="btn ghost" type="button" onClick={() => void askDelete(row.id)}>Ask for this file to be deleted</button>}
        </p>
      ))}
    </div>
  );
}
