import { randomBytes } from "crypto";
import { ID_CONSENT_VERSION } from "./compliance/retention";
import { cleanQualityNote, KEYS_DOCUMENT_KINDS, type KeysDocumentKind } from "./keys-check";
import { IDENTITY_BUCKET, saveKeysFile } from "./keys-check-data";
import { serviceDb } from "./supabase";
import { DECLARED_TYPES, declaredMatches, pdfLooksActive, reencodeImage, sniffType, UPLOAD_MAX_BYTES } from "./upload-check";

/** Files that can be uploaded now. The code clip (code_video) was dropped in Phase 2a; old rows still open. */
export const UPLOAD_KINDS = KEYS_DOCUMENT_KINDS.filter((kind) => kind !== "code_video");

/** Uploads land here first. Nothing in this folder is a kept file. */
export function quarantinePrefix(agentId: string) {
  return `incoming/${agentId}/`;
}

type Body = Record<string, unknown>;

export function readUploadRequest(body: Body) {
  if (body.consent !== "yes" || body.consentVersion !== ID_CONSENT_VERSION) {
    return { error: "Read the consent and confirm it before a file can be stored." };
  }
  const kind = String(body.kind || "");
  if (!(UPLOAD_KINDS as readonly string[]).includes(kind)) return { error: "Choose a Keys Check file." };
  const contentType = String(body.contentType || "");
  if (!(DECLARED_TYPES as readonly string[]).includes(contentType)) return { error: "Use a JPEG, PNG, or PDF." };
  const size = Number(body.size);
  if (!Number.isFinite(size) || size <= 0) return { error: "Choose a file." };
  if (size > UPLOAD_MAX_BYTES) return { error: "That file is larger than 10 MB." };
  return { kind: kind as KeysDocumentKind, contentType, size };
}

/** Issues a one-use signed upload URL for the quarantine folder. The browser sends the file straight to private storage. */
export async function issueUploadUrl(agentId: string, kind: KeysDocumentKind, contentType: string) {
  const db = serviceDb();
  if (!db) return { error: "The file could not be saved." };
  // Clear any earlier upload that was never finished.
  const stale = await db.storage.from(IDENTITY_BUCKET).list(quarantinePrefix(agentId).slice(0, -1), { limit: 100 });
  const names = (stale.data || []).map((item) => `${quarantinePrefix(agentId)}${item.name}`);
  if (names.length) await db.storage.from(IDENTITY_BUCKET).remove(names);
  const extension = contentType === "application/pdf" ? "pdf" : contentType === "image/png" ? "png" : "jpg";
  const path = `${quarantinePrefix(agentId)}${kind}-${randomBytes(12).toString("hex")}.${extension}`;
  const signed = await db.storage.from(IDENTITY_BUCKET).createSignedUploadUrl(path, { upsert: false });
  if (signed.error || !signed.data?.signedUrl) {
    const message = String(signed.error?.message || "").toLowerCase();
    if (message.includes("bucket") || message.includes("not found")) return { error: "The private identity bucket is not set up yet." };
    return { error: "The upload could not be started." };
  }
  return { ok: true, path, uploadUrl: signed.data.signedUrl };
}

/**
 * Checks the uploaded object and keeps it, or deletes it.
 * Magic bytes must match the declared type. Images are decoded and re-encoded as JPEG
 * with no metadata. A PDF with scripts or auto-actions is refused.
 */
export async function finishUpload(agentId: string, body: Body) {
  const request = readUploadRequest({ ...body, size: 1 });
  if ("error" in request) return { error: request.error };
  const path = String(body.path || "");
  const prefix = quarantinePrefix(agentId);
  if (!path.startsWith(prefix) || path.includes("..") || !path.slice(prefix.length).startsWith(`${request.kind}-`)) {
    return { error: "That upload was not found. Choose the file again." };
  }
  const db = serviceDb();
  if (!db) return { error: "The file could not be saved." };
  const bucket = db.storage.from(IDENTITY_BUCKET);
  const drop = () => bucket.remove([path]);
  const downloaded = await bucket.download(path);
  if (downloaded.error || !downloaded.data) {
    await drop();
    return { error: "That upload was not found. Choose the file again." };
  }
  const raw = Buffer.from(await downloaded.data.arrayBuffer());
  if (raw.length === 0 || raw.length > UPLOAD_MAX_BYTES) {
    await drop();
    return { error: "That file is larger than 10 MB." };
  }
  const sniffed = sniffType(raw);
  if (!declaredMatches(request.contentType, sniffed)) {
    await drop();
    return { error: "That file is not a real JPEG, PNG, or PDF." };
  }
  let bytes: Buffer = raw;
  let contentType = request.contentType;
  let extension = "pdf";
  if (sniffed === "pdf") {
    if (pdfLooksActive(raw)) {
      await drop();
      return { error: "That PDF has scripts or actions in it. Use a photo, or save the PDF again as a plain file." };
    }
  } else {
    try {
      bytes = await reencodeImage(raw);
      contentType = "image/jpeg";
      extension = "jpg";
    } catch {
      await drop();
      return { error: "That photo could not be read. Take it again." };
    }
  }
  const saved = await saveKeysFile({
    agentId,
    kind: request.kind,
    bytes,
    contentType,
    extension,
    qualityNote: cleanQualityNote(String(body.qualityNote || "")),
  });
  await drop();
  return saved;
}
