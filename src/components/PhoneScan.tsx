"use client";

import { useState } from "react";
import { IdCamera } from "./IdCamera";
import { idConsentText } from "../lib/compliance/retention";
import { prepareFile } from "./KeysCapture";
import { ID_KINDS, idKindLabel, type IdKind, type KeysDocumentKind } from "../lib/keys-check";
import type { MrzRead } from "../lib/mrz-read";

const STEPS = ["details", "id", "photo", "review"] as const;
type Step = (typeof STEPS)[number];
const STEP_LABELS = ["Details", "ID", "Photo", "Review"];

type ReadState = { readName: string; readNumber: string; readExpiry: string; checksum: MrzRead["checksum"]; readFailed: boolean };

const EMPTY_READ: ReadState = { readName: "", readNumber: "", readExpiry: "", checksum: "none", readFailed: false };

export function PhoneScan({
  consentVersion,
  sample = false,
  initialStep = "details",
  phone = false,
}: {
  consentVersion: string;
  sample?: boolean;
  initialStep?: Step;
  phone?: boolean;
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [idKind, setIdKind] = useState<IdKind>("national_id");
  const [name, setName] = useState(sample ? "Sample Person" : "");
  const [idNumber, setIdNumber] = useState("");
  const [expiry, setExpiry] = useState(sample ? "2028-04-01" : "");
  const [consent, setConsent] = useState(sample);
  const [side, setSide] = useState<"id_front" | "id_back">("id_front");
  const [done, setDone] = useState<string[]>([]);
  const [code, setCode] = useState(sample ? "SAMPLE" : "");
  const [flags, setFlags] = useState<string[]>(sample && initialStep === "review" ? ["The text read on the device does not match what was typed. A person still decides."] : []);
  const [read, setRead] = useState<ReadState>(EMPTY_READ);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");

  const index = STEPS.indexOf(step);

  async function save(extra: Record<string, unknown> = {}) {
    if (sample) {
      setSaved("Sample only. Nothing is stored.");
      return true;
    }
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "draft",
        idKind,
        name,
        idNumber,
        expiry,
        readName: read.readName,
        readNumber: read.readNumber,
        checksum: read.checksum,
        readFailed: read.readFailed,
        ...extra,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNote(data.error || "The check could not be saved.");
      return false;
    }
    setFlags(data.flagSentences || []);
    setSaved("Saved.");
    setNote("");
    return true;
  }

  async function upload(kind: KeysDocumentKind, file: File) {
    if (sample) {
      setDone((current) => current.includes(kind) ? current : [...current, kind]);
      setNote("Sample preview. This does not store a file.");
      return true;
    }
    setBusy(true);
    try {
      const prepared = await prepareFile(file);
      if ("error" in prepared) {
        setNote(prepared.error);
        return false;
      }
      const meta = { kind, consent: "yes", consentVersion, contentType: prepared.type };
      const start = await fetch("/api/agent/identity/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meta, size: prepared.blob.size }),
      });
      const ticket = await start.json().catch(() => ({}));
      if (!start.ok || !ticket.uploadUrl || !ticket.path) {
        setNote(ticket.error || "The upload could not be started.");
        return false;
      }
      const sent = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": prepared.type, "x-upsert": "false" },
        body: prepared.blob,
      });
      if (!sent.ok) {
        setNote("The file could not be sent. Check the connection and try again.");
        return false;
      }
      const res = await fetch("/api/agent/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meta, path: ticket.path }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNote(data.error || "The file could not be saved.");
        return false;
      }
      setDone((current) => current.includes(kind) ? current : [...current, kind]);
      setNote(kind === "id_front" || kind === "id_back" ? "Photo stored. Reading the words on this device." : "Stored in the private bucket.");
      if (kind === "id_front" && prepared.type === "image/jpeg") void recognise(prepared.blob);
      return true;
    } finally {
      setBusy(false);
    }
    return false;
  }

  async function recognise(blob: Blob) {
    const { readDocument } = await import("../lib/read-document");
    const result = await readDocument(blob);
    const nextRead: ReadState = {
      readName: result.mrz.name,
      readNumber: result.mrz.number,
      readExpiry: result.mrz.expiry,
      checksum: result.mrz.checksum,
      readFailed: result.readFailed,
    };
    setRead(nextRead);
    if (!name && result.mrz.name) setName(result.mrz.name);
    if (!idNumber && result.mrz.number) setIdNumber(result.mrz.number);
    if (!expiry && result.mrz.expiry) setExpiry(result.mrz.expiry);
    if (sample) return;
    await save({
      name: name || result.mrz.name,
      idNumber: idNumber || result.mrz.number,
      expiry: expiry || result.mrz.expiry,
      readName: nextRead.readName,
      readNumber: nextRead.readNumber,
      checksum: nextRead.checksum,
      readFailed: nextRead.readFailed,
    });
    setNote(result.readFailed ? "The words could not be read on this device. You can type them." : "Check the name, number, and date. A person still reviews the photos.");
  }

  async function chooseFile(kind: KeysDocumentKind, file: File | undefined) {
    if (!file) return;
    await upload(kind, file);
  }

  async function handoff() {
    if (sample) {
      setQr("");
      setNote("Sample preview. A phone link is not made here.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "issue" }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.url) {
      setNote(data.error || "The phone link could not be made.");
      return;
    }
    const QRCode = (await import("qrcode")).default;
    setQr(await QRCode.toDataURL(data.url, { margin: 1, width: 240 }));
    setNote("The code works once, for 10 minutes. It is not a sign-in to the rest of the desk.");
  }

  async function issueCode() {
    if (sample) {
      setCode("SAMPLE");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "code" }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setNote(data.error || "The code could not be issued.");
    else setCode(data.code || "");
  }

  async function send() {
    if (!(await save())) return;
    if (sample) {
      setNote("Sample preview. This does not send a check.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", idKind, name, idNumber, expiry, readName: read.readName, readNumber: read.readNumber, checksum: read.checksum, readFailed: read.readFailed }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setNote(res.ok ? "Sent to a person at Guyana Keys. This does not approve the check." : data.error || "The check could not be sent.");
  }

  return (
    <section className="scan stack">
      <ol className="scan-progress">
        {STEP_LABELS.map((label, item) => (
          <li key={label} className={item === index ? "on" : item < index ? "done" : ""}>{label}</li>
        ))}
      </ol>
      {saved ? <p className="quiet">{saved}</p> : null}
      {note ? <p>{note}</p> : null}

      {step === "details" ? (
        <div className="stack">
          <h2>Details</h2>
          <p>About a minute. A person at Guyana Keys still looks at the photos.</p>
          <label>Document
            <select value={idKind} onChange={(event) => setIdKind(event.target.value as IdKind)}>
              {ID_KINDS.map((kind) => <option key={kind} value={kind}>{idKindLabel(kind)}</option>)}
            </select>
          </label>
          <label>Name on the document<input value={name} autoComplete="name" onChange={(event) => setName(event.target.value)} /></label>
          <label>ID number<input value={idNumber} autoComplete="off" onChange={(event) => setIdNumber(event.target.value)} /></label>
          <p className="quiet">Guyana Keys keeps a one-way code made from this number and its last 3 characters, not the full number.</p>
          <label>Expiry date<input type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} /></label>
          <p>{idConsentText}</p>
          <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I have read this and I agree to this version ({consentVersion || "not loaded"}).</label>
          <div className="scan-actions">
            <button className="btn" type="button" disabled={!consent || busy} onClick={() => void save().then((ok) => { if (ok) setStep("id"); })}>Continue</button>
            {phone ? null : <button className="btn ghost" type="button" disabled={busy} onClick={() => void handoff()}>Continue on your phone</button>}
          </div>
          {qr ? <img className="scan-qr" src={qr} alt="Code to open this check on a phone" width={240} height={240} /> : null}
        </div>
      ) : null}

      {step === "id" ? (
        <div className="stack">
          <h2>{side === "id_front" ? "Front of the ID" : "Back of the ID"}</h2>
          <p>Fit the document in the frame. The shutter goes off when the photo is sharp and bright enough. You can also tap the button.</p>
          <IdCamera
            key={side}
            title={side === "id_front" ? "Front" : "Back"}
            facing="environment"
            sample={sample}
            onCapture={(blob) => void upload(side, new File([blob], `${side}.jpg`, { type: "image/jpeg" })).then((stored) => {
              if (stored && side === "id_front") setSide("id_back");
            })}
          />
          <label>Or choose a photo
            <input type="file" accept="image/jpeg,image/png" disabled={!consent || busy} onChange={(event) => void chooseFile(side, event.target.files?.[0])} />
          </label>
          <p className="quiet">{done.includes("id_front") ? "Front stored." : "Front not stored yet."} {done.includes("id_back") ? "Back stored." : "Back not stored yet."}</p>
          <div className="scan-actions">
            <button className="btn ghost" type="button" onClick={() => void save().then(() => setStep("details"))}>Back</button>
            <button className="btn" type="button" disabled={!done.includes("id_front") || !done.includes("id_back")} onClick={() => void save().then((ok) => { if (ok) setStep("photo"); })}>Continue</button>
          </div>
        </div>
      ) : null}

      {step === "photo" ? (
        <div className="stack">
          <h2>Photo</h2>
          <p>Hold the ID next to your face. Then photograph the one-time code.</p>
          <p className="scan-code">{code || "······"}</p>
          {code ? null : <button className="btn" type="button" disabled={busy} onClick={() => void issueCode()}>Show a code</button>}
          <p className="quiet">If the code is on another screen, include that screen in the photo. On this phone alone, write the code on paper. This phone cannot photograph its own screen.</p>
          <IdCamera title="Selfie holding the ID" facing="user" sample={sample} onCapture={(blob) => void upload("selfie_with_id", new File([blob], "selfie.jpg", { type: "image/jpeg" }))} />
          <label>Photo of the code
            <input type="file" accept="image/jpeg,image/png" capture="environment" disabled={busy || !code} onChange={(event) => void chooseFile("code_selfie", event.target.files?.[0])} />
          </label>
          <label>Licence
            <input type="file" accept="image/jpeg,image/png,application/pdf" disabled={busy} onChange={(event) => void chooseFile("licence", event.target.files?.[0])} />
          </label>
          <div className="scan-actions">
            <button className="btn ghost" type="button" onClick={() => setStep("id")}>Back</button>
            <button className="btn" type="button" disabled={!done.includes("selfie_with_id") || !done.includes("code_selfie") || !done.includes("licence")} onClick={() => void save().then((ok) => { if (ok) setStep("review"); })}>Continue</button>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="stack">
          <h2>Review</h2>
          <p>Sending this does not approve the check. A person at Guyana Keys looks at the photos. No software compares faces.</p>
          <p>{idKindLabel(idKind)} · {name || "Name not set"} · {idNumber ? `number ends in ${idNumber.slice(-3)}` : "number not set"} · {expiry || "date not set"}</p>
          {flags.length ? flags.map((flag) => <p key={flag}>{flag}</p>) : <p className="quiet">No note from the on-device reading. A person still looks at the photos.</p>}
          <div className="scan-actions">
            <button className="btn ghost" type="button" onClick={() => setStep("photo")}>Back</button>
            <button className="btn" type="button" disabled={busy} onClick={() => void send()}>Send for a person to review</button>
          </div>
        </div>
      ) : null}

    </section>
  );
}

export type { Step };
