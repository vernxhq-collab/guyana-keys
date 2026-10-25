"use client";

import Link from "next/link";
import { useState } from "react";
import { idConsentText } from "../lib/compliance/retention";
import { cleanQualityNote, documentLabel, imageQuality, type KeysDocumentKind } from "../lib/keys-check";

type DocumentRow = { id: string; kind: string; createdAt: string; deletedAt: string };
type KeysState = { status: string; code: string; codeIssuedAt: string; idKind: string; idNumber: string; decisionReason: string } | null;

const slots: { kind: KeysDocumentKind; title: string; detail: string; capture: "environment" | "user"; video?: boolean }[] = [
  { kind: "id_front", title: "ID front", detail: "National ID, passport, or driver's licence.", capture: "environment" },
  { kind: "id_back", title: "ID back", detail: "The other side of the same document.", capture: "environment" },
  { kind: "licence", title: "Licence", detail: "GRA House Agent licence, REABA professional licence, or both. You can add more than one.", capture: "environment" },
  { kind: "selfie_with_id", title: "Selfie holding the ID", detail: "Hold the ID next to your face.", capture: "user" },
];

async function photoWarnings(file: File) {
  if (file.type.startsWith("video/")) return ["About 3 seconds is enough. A person listens to the code. This page does not score the clip."];
  if (!file.type.startsWith("image/")) return [];
  const bitmap = await createImageBitmap(file);
  const max = 64;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return ["This photo could not be read in the browser."];
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const luminance: number[] = [];
  for (let index = 0; index < pixels.length; index += 4) {
    luminance.push(Math.round((pixels[index] * 0.3) + (pixels[index + 1] * 0.59) + (pixels[index + 2] * 0.11)));
  }
  return imageQuality({ width: bitmap.width, height: bitmap.height, sampleWidth: canvas.width, sampleHeight: canvas.height, luminance });
}

export function KeysCapture({
  consentVersion,
  documents,
  keysCheck,
  flags,
  sample = false,
  onDone,
}: {
  consentVersion: string;
  documents: DocumentRow[];
  keysCheck: KeysState;
  flags: string[];
  sample?: boolean;
  onDone?: (message: string) => void;
}) {
  const [consent, setConsent] = useState(false);
  const [idKind, setIdKind] = useState(keysCheck?.idKind || "national_id");
  const [idNumber, setIdNumber] = useState(keysCheck?.idNumber || "");
  const [code, setCode] = useState(keysCheck?.code || "");
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [localNote, setLocalNote] = useState("");
  function report(message: string) {
    setLocalNote(message);
    onDone?.(message);
  }

  async function upload(kind: KeysDocumentKind, file: File | undefined) {
    if (!file) return;
    const found = await photoWarnings(file).catch(() => ["This photo could not be read in the browser."]);
    setWarnings((current) => ({ ...current, [kind]: found }));
    if (sample) {
      report("Sample preview. This does not store a file.");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    body.set("consent", "yes");
    body.set("consentVersion", consentVersion);
    body.set("qualityNote", cleanQualityNote(found.join("\n")));
    setBusy(true);
    const res = await fetch("/api/agent/identity", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    report(res.ok ? data.flag || "Stored in the private bucket. There is no public link." : data.error || "The file could not be saved.");
  }

  async function issue() {
    if (sample) {
      setCode("SAMPLE");
      report("Sample preview. This does not store a code.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "issueCode" }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) report(data.error || "The code could not be issued.");
    else {
      setCode(data.code || "");
      report("Write this code on paper, or say it in a clip of about 3 seconds. It expires in 30 minutes.");
    }
  }

  async function sendCheck() {
    if (sample) {
      report("Sample preview. This does not send a check.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submitKeysCheck", idKind, idNumber }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    report(res.ok ? "Sent to a person at Guyana Keys. Software does not compare the photos." : data.error || "The check could not be sent.");
  }

  const stored = documents.filter((row) => !row.deletedAt);

  return (
    <section className="stack">
      <h2>Keys Check</h2>
      <p>A person at Guyana Keys looks at the files. No outside company is used, and no software compares faces.</p>
      <p>{idConsentText}</p>
      <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I have read this and I agree to this version ({consentVersion || "not loaded"}).</label>
      <p className="quiet">Read the <Link href="/privacy">privacy notice</Link> and <Link href="/terms">terms</Link>.</p>
      {flags.map((flag) => <p key={flag}>{flag}</p>)}
      {keysCheck?.decisionReason ? <p>Last decision: {keysCheck.decisionReason}</p> : null}
      <p className="quiet">Status: {keysCheck?.status || "not started"}</p>
      <label>Document
        <select value={idKind} onChange={(event) => setIdKind(event.target.value)} disabled={!consent}>
          <option value="national_id">National ID</option>
          <option value="passport">Passport</option>
          <option value="drivers_licence">Driver's licence</option>
        </select>
      </label>
      <label>ID number
        <input value={idNumber} onChange={(event) => setIdNumber(event.target.value)} disabled={!consent} autoComplete="off" />
      </label>
      {slots.map((slot) => (
        <fieldset className="panel" key={slot.kind} disabled={!consent || busy}>
          <legend>{slot.title}</legend>
          <p className="quiet">{slot.detail}</p>
          <label>Use the camera
            <input type="file" accept="image/*" capture={slot.capture} onChange={(event) => void upload(slot.kind, event.target.files?.[0])} />
          </label>
          <label>Or choose a file
            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => void upload(slot.kind, event.target.files?.[0])} />
          </label>
          {(warnings[slot.kind] || []).map((line) => <p key={line}>{line}</p>)}
        </fieldset>
      ))}
      <fieldset className="panel" disabled={!consent || busy}>
        <legend>One-time code</legend>
        <p className="quiet">The code is random and stored with the time it was issued. A person checks that the photo or the clip shows that code.</p>
        <button className="btn" type="button" onClick={() => void issue()}>Show a code</button>
        {code ? <p className="keys-code">{code}</p> : null}
        <label>Photo of you holding the code on paper
          <input type="file" accept="image/*" capture="user" onChange={(event) => void upload("code_selfie", event.target.files?.[0])} />
        </label>
        <label>Or choose a photo
          <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => void upload("code_selfie", event.target.files?.[0])} />
        </label>
        <label>Or a clip of about 3 seconds in which you say the code
          <input type="file" accept="video/webm,video/mp4,video/quicktime,video/*" capture="user" onChange={(event) => void upload("code_video", event.target.files?.[0])} />
        </label>
        <label>Or choose a clip
          <input type="file" accept="video/webm,video/mp4,video/quicktime" onChange={(event) => void upload("code_video", event.target.files?.[0])} />
        </label>
        {(warnings.code_selfie || warnings.code_video || []).map((line) => <p key={line}>{line}</p>)}
      </fieldset>
      <button className="btn" type="button" disabled={!consent || busy} onClick={() => void sendCheck()}>Send for a person to review</button>
      {localNote ? <p>{localNote}</p> : null}
      {stored.length === 0 ? <p className="quiet">No Keys Check file stored.</p> : stored.map((row) => (
        <p className="quiet" key={row.id}>{documentLabel(row.kind)} stored. There is no public link.</p>
      ))}
    </section>
  );
}
