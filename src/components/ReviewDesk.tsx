"use client";

import { useMemo, useState } from "react";
import { idKindLabel, subjectLabel } from "../lib/keys-check";
import {
  decisionLabel,
  evidenceRefError,
  isSenior,
  QUEUES,
  sortReviewItems,
  type QueueId,
  type ReviewDeskData,
  type ReviewItem,
} from "../lib/levels";

const fileOrder = ["id_front", "id_back", "selfie_with_id", "code_selfie", "licence"];

export function ReviewDesk({
  initial,
  sample = false,
  focus = "queue",
}: {
  initial: ReviewDeskData;
  sample?: boolean;
  focus?: "queue" | "detail" | "licence";
}) {
  const [data, setData] = useState(initial);
  const [queue, setQueue] = useState<QueueId>(focus === "licence" ? "licence" : "level2");
  const [active, setActive] = useState(focus === "detail" ? "sample-flagged" : focus === "licence" ? "sample-licence" : "");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<{ id: string; kind: string; label: string; url: string }[]>([]);
  const rows = useMemo(() => sortReviewItems(data.items.filter((item) => item.queue === queue)), [data.items, queue]);
  const selected = rows.find((item) => item.id === active) || null;
  const senior = isSenior(data.role || "");

  function load() {
    if (sample) return;
    fetch("/api/admin?part=levels")
      .then(async (res) => ({ ok: res.ok, body: await res.json() }))
      .then(({ ok, body }) => {
        if (!ok || body.error) setNote(body.error || "Could not load the review desk.");
        else setData(body);
      })
      .catch(() => setNote("Could not load the review desk."));
  }

  async function post(body: Record<string, unknown>, done: string) {
    if (body.keep) {
      setNote(done);
      return;
    }
    if (sample) {
      setNote("Sample preview. Nothing was saved.");
      return;
    }
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await res.json().catch(() => ({}));
    setNote(res.ok ? done : payload.error || "That could not be saved.");
    if (res.ok) {
      setOpen([]);
      load();
    }
  }

  async function openFiles(id: string) {
    if (sample) {
      setNote("Sample preview. A real review opens each file for 60 seconds and writes an audit row. This preview has no file.");
      return;
    }
    const res = await fetch(`/api/admin?part=keysFiles&id=${encodeURIComponent(id)}`);
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNote(payload.error || "The files could not be opened.");
      return;
    }
    setOpen(payload.files || []);
    setNote("Opened for 60 seconds. Each file is in the audit log. Software did not compare the faces.");
  }

  if (data.needsSetup) {
    return (
      <div className="stack">
        <h1>Keys Check</h1>
        <p>The review desk needs a reviewer role on your account. You can add yourself as the admin reviewer. This does not approve any agent. Thank you.</p>
        <button className="btn" type="button" onClick={() => void post({ action: "grantReviewer" }, "You can review checks now.")}>Add me as the admin reviewer</button>
        {note ? <p>{note}</p> : null}
      </div>
    );
  }

  return (
    <div className="stack">
      <h1>Keys Check</h1>
      <p className="quiet">A person reviews the files. Flagged and mismatched items are listed first. Saving notes does not approve the check. No face-matching software runs.</p>
      {senior ? <button className="btn ghost" type="button" onClick={() => void post({ action: "levelDecision", decision: "expire", reason: "Run the expiry check." }, "The expiry check has run.")}>Run the expiry check</button> : null}
      <div className="purpose-tabs">
        {QUEUES.map((item) => {
          const count = data.queues.find((row) => row.id === item.id)?.count || 0;
          return (
            <button key={item.id} className={queue === item.id ? "on" : ""} type="button" onClick={() => { setQueue(item.id); setActive(""); setOpen([]); }}>
              {item.label} ({count})
            </button>
          );
        })}
      </div>
      {note ? <p>{note}</p> : null}
      {focus !== "queue" && selected ? null : rows.length === 0 ? <p>Nothing is waiting in this queue.</p> : rows.map((row) => (
        <button className="panel" key={row.id} type="button" onClick={() => setActive(row.id)} style={{ textAlign: "left" }}>
          <strong>{row.agentName}</strong>
          {row.priority ? <span className="chip">Flagged</span> : null}
          <p className="quiet">{row.summary}</p>
          {row.flags.map((flag) => <p key={flag}>{flag}</p>)}
        </button>
      ))}
      {selected ? <ReviewDetail item={selected} senior={senior} files={open} onOpen={() => void openFiles(selected.applicationId || selected.id)} onPost={post} /> : null}
    </div>
  );
}

function ReviewDetail({
  item,
  senior,
  files,
  onOpen,
  onPost,
}: {
  item: ReviewItem;
  senior: boolean;
  files: { id: string; kind: string; label: string; url: string }[];
  onOpen: () => void;
  onPost: (body: Record<string, unknown>, done: string) => Promise<void>;
}) {
  const level2 = item.queue === "level2" || item.queue === "returned";
  const licence = item.queue === "licence";
  return (
    <form className="panel stack" key={item.id} onSubmit={(event) => event.preventDefault()}>
      <h2>{item.agentName}</h2>
      <p className="quiet">{item.summary}</p>
      {item.flags.map((flag) => <p key={flag}>{flag}</p>)}
      {item.statement ? <p>{item.statement}</p> : null}
      {level2 ? (
        <>
          <p className="quiet">{subjectLabel(item.checklist?.subjectType || "") || "Agent"} · {idKindLabel(item.checklist?.idKind || "") || "document not set"} · {item.checklist?.idNumberLast3 ? `number ends in ${item.checklist.idNumberLast3}` : "number not set"} · code {item.checklist?.code || "not issued"}</p>
          <button className="btn" type="button" onClick={onOpen}>Open the files for 60 seconds</button>
          {files.length > 0 ? (
            <div className="keys-grid">
              {fileOrder.flatMap((kind) => files.filter((file) => file.kind === kind).map((file) => (
                <figure key={file.id}>
                  <figcaption>{file.label}</figcaption>
                  <a href={file.url}>Open {file.label}</a>
                </figure>
              )))}
            </div>
          ) : null}
          <p className="quiet">Saving notes does not approve the check. Software did not compare the faces.</p>
        </>
      ) : null}
      {item.history.length > 0 ? (
        <div className="stack">
          <p className="quiet">What happened</p>
          {item.history.map((row) => <p key={`${row.action}-${row.at}`} className="quiet">{decisionLabel(row.action) || "Update"} · {row.reason}</p>)}
        </div>
      ) : null}
      {licence ? (
        <>
          <p className="quiet">An uploaded licence image on its own does not complete this check.</p>
          <label>How the licence was confirmed
            <textarea name="evidence" placeholder="GRA Licence Revenue Office confirmed by email, ref 1044" />
          </label>
          <label>How you checked
            <select name="method" defaultValue="issuer_email">
              <option value="issuer_email">Email from the office</option>
              <option value="issuer_phone">Phone call to the office</option>
              <option value="registry">A register</option>
            </select>
          </label>
        </>
      ) : null}
      <label>Reason
        <textarea name="reason" defaultValue={item.reason} />
      </label>
      <div className="actions">
        {level2 ? (
          <>
            <button className="btn" type="button" onClick={(event) => void send(event, item, "approve", "Approved. The public line can now read ID reviewed by Guyana Keys.", onPost)}>Approve</button>
            <button className="btn ghost" type="button" onClick={(event) => void send(event, item, "reject", "Not approved. The agent can read the reason.", onPost)}>Not approved</button>
            <button className="btn ghost" type="button" onClick={(event) => void send(event, item, "request_info", "The agent can send more information.", onPost)}>Ask for more information</button>
          </>
        ) : null}
        {licence ? (
          <>
            <button className="btn" type="button" onClick={(event) => void send(event, item, "licence_approve", "The licence check is recorded.", onPost)}>Record the licence check</button>
            <button className="btn ghost" type="button" onClick={(event) => void send(event, item, "licence_reject", "The licence check was not recorded.", onPost)}>Not approved</button>
          </>
        ) : null}
        {item.queue === "appeals" ? (
          <>
            <button className="btn" type="button" onClick={(event) => void send(event, item, "appeal_upheld", "The appeal was upheld.", onPost)}>Uphold the appeal</button>
            <button className="btn ghost" type="button" onClick={(event) => void send(event, item, "appeal_denied", "The appeal was not upheld.", onPost)}>Do not uphold the appeal</button>
          </>
        ) : null}
        {item.queue === "reports" ? <button className="btn ghost" type="button" onClick={(event) => void send(event, item, "handle_report", "The report is marked handled.", onPost)}>Mark the report handled</button> : null}
        {senior && item.agentId ? (
          <>
            <button className="btn ghost" type="button" onClick={(event) => void send(event, item, "suspend", "The badge is paused.", onPost)}>Pause the badge</button>
            <button className="btn ghost" type="button" onClick={(event) => void send(event, item, "revoke", "The badge is removed.", onPost)}>Remove the badge</button>
          </>
        ) : null}
      </div>
    </form>
  );
}

async function send(
  event: React.MouseEvent<HTMLButtonElement>,
  item: ReviewItem,
  decision: string,
  done: string,
  onPost: (body: Record<string, unknown>, done: string) => Promise<void>,
) {
  const form = new FormData(event.currentTarget.form as HTMLFormElement);
  const reason = String(form.get("reason") || "");
  const evidence = String(form.get("evidence") || "");
  if (decision === "licence_approve") {
    const problem = evidenceRefError(evidence);
    if (problem) {
      await onPost({ action: "levelDecision", decision, reason: problem, evidenceRef: evidence, keep: true }, problem);
      return;
    }
  }
  if (reason.trim().length < 8 && decision !== "expire") {
    await onPost({ action: "levelDecision", decision, reason, keep: true }, "Write the reason for this decision.");
    return;
  }
  await onPost({
    action: "levelDecision",
    decision,
    reason,
    evidenceRef: evidence,
    method: String(form.get("method") || ""),
    id: item.id,
    applicationId: item.applicationId,
    appealId: item.appealId,
    agentId: item.agentId,
  }, done);
}
