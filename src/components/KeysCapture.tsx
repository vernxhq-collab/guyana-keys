"use client";

import Link from "next/link";
import { useState } from "react";
import { idConsentText } from "../lib/compliance/retention";
import { cleanQualityNote, documentLabel, imageQuality, type KeysDocumentKind } from "../lib/keys-check";

type DocumentRow = { id: string; kind: string; createdAt: string; deletedAt: string };
type KeysState = { status: string; code: string; codeIssuedAt: string; idKind: string; idNumberLast3: string; decisionReason: string } | null;

const slots: { kind: KeysDocumentKind; title: string; detail: string; capture: "environment" | "user" }[] = [
  { kind: "id_front", title: "ID front", detail: "National ID, passport, or driver's licence.", capture: "environment" },
  { kind: "id_back", title: "ID back", detail: "The other side of the same document.", capture: "environment" },
  { kind: "licence", title: "Licence", detail: "GRA House Agent licence, REABA professional licence, or both. You can add more than one.", capture: "environment" },
  { kind: "selfie_with_id", title: "Selfie holding the ID", detail: "Hold the ID next to your face.", capture: "user" },
];

const MAX_EDGE = 1600;
const PDF_LIMIT = 10_000_000;

/**
 * Shrinks a photo in the browser before it is sent: the long edge is capped at 1600 px
 * and it is saved as a JPEG at quality 0.8. That also drops the camera metadata.
 * A PDF is sent as it is, up to 10 MB.
 */
export async function prepareFile(file: File): Promise<{ blob: Blob; type: "image/jpeg" | "application/pdf" } | { error: string }> {
  if (file.type === "application/pdf") {
    if (file.size > PDF_LIMIT) return { error: "That PDF is larger than 10 MB. Take a photo of the page instead." };
    return { blob: file, type: "application/pdf" };
  }
  if (!file.type.startsWith("image/")) return { error: "Use a photo, or a PDF." };
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bitmap) return { error: "This photo could not be read in the browser. Take it again, or choose a JPEG." };
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return { error: "This photo could not be read in the browser." };
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  if (!blob) return { error: "This photo could not be prepared. Try again." };
  return { blob, type: "image/jpeg" };
}

async function photoWarnings(file: File) {
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
  const [idNumber, setIdNumber] = useState("");
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
    setBusy(true);
    try {
      const prepared = await prepareFile(file);
      if ("error" in prepared) {
        report(prepared.error);
        return;
      }
      const meta = { kind, consent: "yes", consentVersion, contentType: prepared.type };
      const start = await fetch("/api/agent/identity/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meta, size: prepared.blob.size }),
      });
      const ticket = await start.json().catch(() => ({}));
      if (!start.ok || !ticket.uploadUrl) {
        report(ticket.error || "The upload could not be started.");
        return;
      }
      // Straight to private storage. The file does not pass through the site's server.
      const sent = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": prepared.type, "x-upsert": "false" },
        body: prepared.blob,
      });
      if (!sent.ok) {
        report("The file could not be sent. Check the connection and try again.");
        return;
      }
      const res = await fetch("/api/agent/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meta, path: ticket.path, qualityNote: cleanQualityNote(found.join("\n")) }),
      });
      const data = await res.json().catch(() => ({}));
      report(res.ok ? data.flag || "Stored in the private bucket. There is no public link." : data.error || "The file could not be saved.");
    } catch {
      report("The file could not be sent. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
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
      report("Write this code on paper and take a photo of you holding it. It expires in 30 minutes.");
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
      <p className="quiet">Guyana Keys keeps a one-way code made from this number and its last 3 characters, not the full number.{keysCheck?.idNumberLast3 ? ` On file: ends in ${keysCheck.idNumberLast3}.` : ""}</p>
      <p className="quiet">Photos are made smaller on this device before they are sent.</p>
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
        <p className="quiet">The code is random and stored with the time it was issued. A person checks that the photo shows that code.</p>
        <button className="btn" type="button" onClick={() => void issue()}>Show a code</button>
        {code ? <p className="keys-code">{code}</p> : null}
        <label>Photo of you holding the code on paper
          <input type="file" accept="image/*" capture="user" onChange={(event) => void upload("code_selfie", event.target.files?.[0])} />
        </label>
        <label>Or choose a photo
          <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => void upload("code_selfie", event.target.files?.[0])} />
        </label>
        {(warnings.code_selfie || []).map((line) => <p key={line}>{line}</p>)}
      </fieldset>
      <button className="btn" type="button" disabled={!consent || busy} onClick={() => void sendCheck()}>Send for a person to review</button>
      {localNote ? <p>{localNote}</p> : null}
      {stored.length === 0 ? <p className="quiet">No Keys Check file stored.</p> : stored.map((row) => (
        <p className="quiet" key={row.id}>{documentLabel(row.kind)} stored. There is no public link.</p>
      ))}
    </section>
  );
}
