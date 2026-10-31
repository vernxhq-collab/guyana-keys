"use client";

import { useEffect, useState } from "react";
import { CheckOutcome } from "../../../../components/CheckOutcome";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";
import { KeysCapture } from "../../../../components/KeysCapture";
import { PhoneScan } from "../../../../components/PhoneScan";
import type { AgentOutcome } from "../../../../lib/levels";
import { documentLabel } from "../../../../lib/keys-check";
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
type KeysState = { status: string; code: string; codeIssuedAt: string; idKind: string; idNumberLast3: string; decisionReason: string } | null;

export default function ChecksPage() {
  const [ready, setReady] = useState(true);
  const [licences, setLicences] = useState<Licence[] | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [keysCheck, setKeysCheck] = useState<KeysState>(null);
  const [flags, setFlags] = useState<string[]>([]);
  const [identity, setIdentity] = useState("");
  const [consentVersion, setConsentVersion] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [earlier, setEarlier] = useState(false);
  const [outcome, setOutcome] = useState<AgentOutcome | null>(null);

  function load() {
    fetch("/api/agent?part=checks")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data.error) setError(data.error || "Could not load checks.");
        else {
          setReady(data.ready !== false);
          setLicences(data.licences || []);
          setDocuments(data.documents || []);
          setKeysCheck(data.keysCheck || null);
          setFlags(data.flags || []);
          setIdentity(data.identity?.status || "not submitted");
          setConsentVersion(data.consentVersion || "");
          setOutcome(data.outcome || null);
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
      <p className="quiet">ID check status: {identity}. Keys Check is reviewed by a person. No outside company and no face-matching software is used.</p>
      <p>Get your ID reviewed to help make Guyana Keys a safer place to find property. Thank you.</p>
      <CheckOutcome outcome={outcome} onAppeal={async (statement) => {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "appeal", statement, decisionId: outcome?.appealDecisionId || "" }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          load();
          return "Your appeal has been received. A senior reviewer will look at it. Thank you.";
        }
        return data.error || "The appeal could not be sent.";
      }} />
      <PhoneScan consentVersion={consentVersion} />
      <p className="quiet"><button className="btn ghost" type="button" onClick={() => setEarlier((current) => !current)}>{earlier ? "Hide the earlier form" : "Use the earlier upload form"}</button></p>
      {earlier ? <KeysCapture consentVersion={consentVersion} documents={documents} keysCheck={keysCheck} flags={flags} onDone={(message) => { setNote(message); load(); }} /> : null}
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
      {documents.length === 0 ? null : documents.map((row) => (
        <p className="quiet-row" key={row.id}>
          <span>{documentLabel(row.kind)} · {row.deletedAt ? "Deleted" : "Stored"} · consent {row.consentVersion}</span>
          {row.deletedAt ? null : <button className="btn ghost" type="button" onClick={() => void askDelete(row.id)}>Ask for this file to be deleted</button>}
        </p>
      ))}
    </div>
  );
}
