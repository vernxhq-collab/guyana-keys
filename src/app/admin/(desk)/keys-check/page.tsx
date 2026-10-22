"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";
import { subjectLabel } from "../../../../lib/keys-check";

type Check = {
  id: string;
  agentName: string;
  subjectType: string;
  status: string;
  idKind: string;
  idNumber: string;
  code: string;
  codeIssuedAt: string;
  reviewerNotes: string;
  decisionReason: string;
  flags: string[];
  nameMatches: boolean;
  faceMatches: boolean;
  codeMatches: boolean;
  documentNotExpired: boolean;
  licenceRecorded: boolean;
  licenceExpiryOk: boolean;
};

type OpenFile = { id: string; kind: string; label: string; url: string; qualityNote: string };

const order = ["id_front", "id_back", "selfie_with_id", "code_selfie", "code_video", "licence"];

export default function KeysCheckAdminPage() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [ready, setReady] = useState(true);
  const [open, setOpen] = useState<OpenFile[]>([]);
  const [active, setActive] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin?part=keys")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data.error) setError(data.error || "Could not load Keys Check.");
        else {
          setReady(data.ready !== false);
          setChecks(data.checks || []);
        }
      })
      .catch(() => setError("Could not load Keys Check."));
  }

  useEffect(() => { load(); }, []);

  async function post(body: Record<string, unknown>, done: string) {
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setNote(res.ok ? done : data.error || "That could not be saved.");
    if (res.ok) {
      setOpen([]);
      load();
    }
  }

  async function openSet(id: string) {
    const res = await fetch(`/api/admin?part=keysFiles&id=${encodeURIComponent(id)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNote(data.error || "The files could not be opened.");
      return;
    }
    setActive(id);
    setOpen(data.files || []);
    setNote("Opened for 60 seconds. Each file is in the audit log. Software did not compare the faces.");
  }

  if (error) return <p>{error}</p>;
  if (!checks) return <DeskSkeleton count={3} />;
  return (
    <div className="stack">
      <h1>Keys Check</h1>
      <p className="quiet">A person reviews the files. Saving notes does not approve the check. Approval, rejection, or a request to send the files again is a second step, with its own time and reason. No face-matching software runs.</p>
      {!ready ? <p>Keys Check is not ready on this desk yet.</p> : null}
      {note ? <p>{note}</p> : null}
      {checks.length === 0 ? <p>No check has been sent.</p> : checks.map((row) => (
        <form className="panel stack" key={`${row.id}-${row.status}`} onSubmit={(event) => event.preventDefault()}>
          <strong>{row.agentName}</strong>
          <p className="quiet">{subjectLabel(row.subjectType) || "Agent"} · {row.status} · {row.idKind || "document not set"} · {row.idNumber || "number not set"} · code {row.code || "not issued"}</p>
          {row.flags.map((flag) => <p key={flag}>{flag}</p>)}
          <button className="btn" type="button" onClick={() => void openSet(row.id)}>Open the files</button>
          {active === row.id && open.length > 0 ? (
            <div className="keys-grid">
              {order.flatMap((kind) => open.filter((file) => file.kind === kind).map((file) => (
                <figure key={file.id}>
                  <figcaption>{file.label}</figcaption>
                  {file.kind === "code_video" ? <video src={file.url} controls /> : <img src={file.url} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                  <a href={file.url}>Open {file.label}</a>
                  {file.qualityNote ? <p className="quiet">{file.qualityNote}</p> : null}
                </figure>
              )))}
            </div>
          ) : null}
          <label><input type="checkbox" name="nameMatches" defaultChecked={row.nameMatches} /> The name matches the account, in your judgement.</label>
          <label><input type="checkbox" name="faceMatches" defaultChecked={row.faceMatches} /> The face in the selfie looks like the photo on the ID, in your judgement. Software did not compare them.</label>
          <label><input type="checkbox" name="codeMatches" defaultChecked={row.codeMatches} /> The code on the paper or in the clip is the code that was issued.</label>
          <label><input type="checkbox" name="documentNotExpired" defaultChecked={row.documentNotExpired} /> The ID is not expired.</label>
          <label><input type="checkbox" name="licenceRecorded" defaultChecked={row.licenceRecorded} /> The licence number and type are recorded.</label>
          <label><input type="checkbox" name="licenceExpiryOk" defaultChecked={row.licenceExpiryOk} /> The licence expiry is recorded and is not past.</label>
          <label>Review notes
            <textarea name="notes" defaultValue={row.reviewerNotes} />
          </label>
          <button className="btn" type="button" onClick={(event) => {
            const form = new FormData((event.currentTarget.form as HTMLFormElement));
            void post({
              action: "keysNotes",
              id: row.id,
              notes: form.get("notes"),
              nameMatches: form.get("nameMatches") === "on",
              faceMatches: form.get("faceMatches") === "on",
              codeMatches: form.get("codeMatches") === "on",
              documentNotExpired: form.get("documentNotExpired") === "on",
              licenceRecorded: form.get("licenceRecorded") === "on",
              licenceExpiryOk: form.get("licenceExpiryOk") === "on",
            }, "Notes saved. This does not approve the check.");
          }}>Save review notes</button>
          <label>Decision reason
            <textarea name="reason" defaultValue={row.decisionReason} />
          </label>
          <div className="actions">
            <button className="btn" type="button" disabled={row.status !== "noted"} onClick={(event) => {
              const form = new FormData((event.currentTarget.form as HTMLFormElement));
              void post({ action: "keysDecision", id: row.id, decision: "approve", reason: form.get("reason") }, "Approved. The public line can now include the ID check.");
            }}>Approve</button>
            <button className="btn ghost" type="button" disabled={row.status !== "noted"} onClick={(event) => {
              const form = new FormData((event.currentTarget.form as HTMLFormElement));
              void post({ action: "keysDecision", id: row.id, decision: "reject", reason: form.get("reason") }, "Rejected.");
            }}>Reject</button>
            <button className="btn ghost" type="button" disabled={row.status !== "noted"} onClick={(event) => {
              const form = new FormData((event.currentTarget.form as HTMLFormElement));
              void post({ action: "keysDecision", id: row.id, decision: "resubmit", reason: form.get("reason") }, "The agent can send the files again.");
            }}>Ask for the files again</button>
          </div>
        </form>
      ))}
    </div>
  );
}
