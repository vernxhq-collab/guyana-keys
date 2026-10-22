"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";

type Licence = {
  id: string;
  agentId: string;
  agentName: string;
  label: string;
  number: string;
  issuingBody: string;
  issueDate: string;
  expiry: string;
  status: string;
  notes: string;
};

type Identity = { agentId: string; agentName: string; status: string; notes: string };
type DocumentRow = { id: string; agentName: string; kind: string; deletedAt: string };
type Deletion = { id: string; agentName: string; documentId: string; status: string; note: string };

export default function LicencesPage() {
  const [ready, setReady] = useState(true);
  const [licences, setLicences] = useState<Licence[] | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [deletions, setDeletions] = useState<Deletion[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin?part=licences")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data.error) setError(data.error || "Could not load checks.");
        else {
          setReady(data.ready !== false);
          setLicences(data.licences || []);
          setIdentities(data.identities || []);
          setDocuments(data.documents || []);
          setDeletions(data.deletions || []);
        }
      })
      .catch(() => setError("Could not load checks."));
  }

  useEffect(() => { load(); }, []);

  async function post(body: Record<string, unknown>, done: string) {
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setNote(res.ok ? done : data.error || "That could not be saved.");
    if (res.ok) load();
  }

  async function openFile(id: string, download: boolean) {
    const res = await fetch(`/api/admin?part=document&id=${encodeURIComponent(id)}&intent=${download ? "download" : "view"}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setNote(data.error || "The file could not be opened.");
      return;
    }
    window.open(data.url, "_blank", "noopener");
    setNote("Opened for 60 seconds. This view is in the audit log.");
  }

  if (error) return <p>{error}</p>;
  if (!licences) return <DeskSkeleton count={3} />;
  return (
    <div className="stack">
      <h1>Licences and identity</h1>
      <p className="quiet">A public badge names the check, for example “ID and GRA House Agent licence checked by Guyana Keys · Oct 2026”. An expired licence drops off that line. The retention review job is switched off and does not delete files.</p>
      {!ready ? <p>These tables are not ready yet.</p> : null}
      {note ? <p>{note}</p> : null}
      <h2>Licences</h2>
      {licences.length === 0 ? <p>No licence submitted.</p> : licences.map((row) => (
        <form className="panel" key={row.id} onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void post({ action: "reviewLicence", id: row.id, status: form.get("status"), notes: form.get("notes") }, "Licence check saved.");
        }}>
          <strong>{row.agentName}</strong>
          <p>{row.label} · {row.number || "no number"} · {row.issuingBody || "issuing body not set"}</p>
          <p className="quiet">Issued {row.issueDate || "not set"} · expires {row.expiry || "not set"} · status {row.status}</p>
          <label>Status
            <select name="status" defaultValue={row.status}>
              <option value="pending">pending</option>
              <option value="checked">checked</option>
              <option value="rejected">rejected</option>
              <option value="expired">expired</option>
            </select>
          </label>
          <label>Notes<textarea name="notes" defaultValue={row.notes} /></label>
          <button className="btn" type="submit">Save check</button>
        </form>
      ))}
      <h2>ID checks</h2>
      {identities.length === 0 ? <p>No ID check recorded.</p> : identities.map((row) => (
        <form className="panel" key={row.agentId} onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void post({ action: "reviewIdentity", agentId: row.agentId, status: form.get("status"), notes: form.get("notes") }, "ID check saved.");
        }}>
          <strong>{row.agentName}</strong>
          <p className="quiet">Status {row.status}</p>
          <label>Status
            <select name="status" defaultValue={row.status}>
              <option value="pending">pending</option>
              <option value="checked">checked</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <label>Notes<textarea name="notes" defaultValue={row.notes} /></label>
          <button className="btn" type="submit">Save ID check</button>
        </form>
      ))}
      <h2>Files</h2>
      <p className="quiet">Opening a file writes an audit row first, then a 60-second link. The file is not used in marketing and is not sent to an AI model.</p>
      {documents.length === 0 ? <p>No identity file stored.</p> : documents.map((row) => (
        <p className="quiet-row" key={row.id}>
          <span>{row.agentName} · {row.kind === "selfie" ? "Selfie" : "ID scan"} · {row.deletedAt ? "Deleted" : "Stored"}</span>
          {row.deletedAt ? null : (
            <span className="actions">
              <button className="btn ghost" type="button" onClick={() => void openFile(row.id, false)}>View</button>
              <button className="btn ghost" type="button" onClick={() => void openFile(row.id, true)}>Download</button>
              <button className="btn ghost" type="button" onClick={() => void post({ action: "purgeDocument", documentId: row.id }, "File deleted.")}>Purge</button>
            </span>
          )}
        </p>
      ))}
      <h2>Deletion requests</h2>
      {deletions.length === 0 ? <p>No deletion request.</p> : deletions.map((row) => (
        <p className="quiet-row" key={row.id}>
          <span>{row.agentName} · {row.status}{row.note ? ` · ${row.note}` : ""}</span>
          {row.status === "requested" ? (
            <span className="actions">
              <button className="btn ghost" type="button" onClick={() => void post({ action: "purgeDocument", documentId: row.documentId }, "File deleted.")}>Purge</button>
              <button className="btn ghost" type="button" onClick={() => void post({ action: "declineDeletion", requestId: row.id }, "Request declined.")}>Decline</button>
            </span>
          ) : null}
        </p>
      ))}
    </div>
  );
}
