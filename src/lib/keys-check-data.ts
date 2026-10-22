import { createHash, randomInt } from "crypto";
import { ID_CONSENT_VERSION, RETENTION_MONTHS } from "./compliance/retention";
import { newId } from "./labels";
import {
  codeStillCurrent,
  documentLabel,
  flagSentence,
  ID_KINDS,
  KEYS_DOCUMENT_KINDS,
  makeCheckCode,
  type IdKind,
  type KeysDocumentKind,
  verificationProvider,
} from "./keys-check";
import { serviceDb } from "./supabase";

export const IDENTITY_BUCKET = "identity-documents";

type Row = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function missingTable(error: { message?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("schema cache") || message.includes("does not exist") || message.includes("could not find");
}

function viewCheck(row: Row | null) {
  if (!row) return null;
  return {
    id: text(row.id),
    status: text(row.status) || "collecting",
    provider: text(row.provider) || verificationProvider().id,
    idKind: text(row.id_kind),
    idNumber: text(row.id_number),
    code: text(row.code),
    codeIssuedAt: text(row.code_issued_at),
    submittedAt: text(row.submitted_at),
    reviewerName: text(row.reviewer_name),
    reviewerNotes: text(row.reviewer_notes),
    reviewedAt: text(row.reviewed_at),
    nameMatches: row.name_matches === true,
    faceMatches: row.face_matches === true,
    codeMatches: row.code_matches === true,
    documentNotExpired: row.document_not_expired === true,
    licenceRecorded: row.licence_recorded === true,
    licenceExpiryOk: row.licence_expiry_ok === true,
    decision: text(row.decision),
    decisionReason: text(row.decision_reason),
    decidedBy: text(row.decided_by),
    decidedAt: text(row.decided_at),
  };
}

async function latestCheck(agentId: string) {
  const db = serviceDb();
  if (!db) return { db: null, row: null as Row | null, missing: false };
  const { data, error } = await db.from("keys_checks").select("*").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(1);
  if (missingTable(error)) return { db, row: null, missing: true };
  return { db, row: (data?.[0] as Row | undefined) || null, missing: false };
}

export async function loadAgentKeysCheck(agentId: string) {
  const found = await latestCheck(agentId);
  if (!found.db || found.missing) return { ready: false, check: null, flags: [] as string[] };
  const flags = await found.db.from("keys_check_flags").select("flag").eq("agent_id", agentId);
  return {
    ready: true,
    check: viewCheck(found.row),
    flags: (flags.data || []).map((row) => flagSentence(text(row.flag))).filter(Boolean),
  };
}

export async function issueKeysCode(agentId: string) {
  const found = await latestCheck(agentId);
  if (!found.db) return { error: "The code could not be issued." };
  if (found.missing) return { error: "Keys Check is not ready on this desk yet." };
  const code = makeCheckCode((max) => randomInt(0, max));
  const issuedAt = new Date().toISOString();
  const current = found.row;
  const open = current && (text(current.status) === "collecting");
  if (open) {
    const { error } = await found.db.from("keys_checks").update({ code, code_issued_at: issuedAt, provider: "manual" }).eq("id", text(current.id)).eq("agent_id", agentId);
    if (error) return { error: "The code could not be issued." };
    return { ok: true, code, issuedAt };
  }
  if (current && text(current.status) === "submitted") return { error: "This check is already with a reviewer." };
  if (current && text(current.status) === "noted") return { error: "This check is already with a reviewer." };
  const { error } = await found.db.from("keys_checks").insert({
    id: newId("chk"),
    agent_id: agentId,
    status: "collecting",
    provider: "manual",
    code,
    code_issued_at: issuedAt,
  });
  if (error) return { error: "The code could not be issued." };
  return { ok: true, code, issuedAt };
}

export async function saveKeysFile(input: {
  agentId: string;
  kind: string;
  bytes: Buffer;
  contentType: string;
  extension: string;
  qualityNote: string;
}) {
  const db = serviceDb();
  if (!db) return { error: "The file could not be saved." };
  if (!KEYS_DOCUMENT_KINDS.includes(input.kind as KeysDocumentKind)) return { error: "Choose a Keys Check file." };
  const found = await latestCheck(input.agentId);
  if (found.missing || !found.db) return { error: "Keys Check is not ready on this desk yet." };
  let check = found.row;
  if (!check || text(check.status) === "approved" || text(check.status) === "rejected") {
    const createdId = newId("chk");
    const created = await found.db.from("keys_checks").insert({ id: createdId, agent_id: input.agentId, status: "collecting", provider: "manual" });
    if (created.error) return { error: "The check could not be opened." };
    check = { id: createdId, status: "collecting", code: "", code_issued_at: "" };
  }
  if (text(check.status) !== "collecting") return { error: "This check is already with a reviewer." };
  if (input.kind === "code_selfie" || input.kind === "code_video") {
    if (!codeStillCurrent(text(check.code_issued_at))) return { error: "That code has expired. Issue a new one." };
  }
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  const id = newId("idd");
  const path = `${input.agentId}/${input.kind}-${id}.${input.extension}`;
  const uploaded = await db.storage.from(IDENTITY_BUCKET).upload(path, input.bytes, { contentType: input.contentType, upsert: false });
  if (uploaded.error) {
    const message = String(uploaded.error.message || "").toLowerCase();
    if (message.includes("bucket") || message.includes("not found")) return { error: "The private identity bucket is not set up yet." };
    return { error: "The file could not be saved." };
  }
  const { error } = await db.from("id_documents").insert({
    id,
    agent_id: input.agentId,
    kind: input.kind,
    storage_path: path,
    consent_version: ID_CONSENT_VERSION,
    consent_at: new Date().toISOString(),
    retention_months: RETENTION_MONTHS,
    sha256,
    quality_note: input.qualityNote,
    check_id: text(check.id),
  });
  if (error) {
    await db.storage.from(IDENTITY_BUCKET).remove([path]);
    if (missingTable(error)) return { error: "Keys Check is not ready on this desk yet." };
    return { error: "The file could not be saved." };
  }
  const flagged = await db.from("keys_check_flags").select("flag").eq("id", `flg-${id}`).maybeSingle();
  const sentence = flagSentence(text(flagged.data?.flag));
  return sentence ? { ok: true, flag: sentence } : { ok: true };
}

export async function submitKeysCheck(agentId: string, body: Record<string, unknown>) {
  const db = serviceDb();
  if (!db) return { error: "The check could not be sent." };
  const idKind = text(body.idKind);
  if (!ID_KINDS.includes(idKind as IdKind)) return { error: "Choose national ID, passport, or driver's licence." };
  const idNumber = text(body.idNumber).trim().toUpperCase().replace(/\s+/g, "").slice(0, 40);
  if (idNumber.length < 4) return { error: "Enter the ID number." };
  const found = await latestCheck(agentId);
  if (found.missing || !found.row || text(found.row.status) !== "collecting") return { error: "Keys Check is not open for this account." };
  if (!text(found.row.code) || !codeStillCurrent(text(found.row.code_issued_at))) return { error: "Issue a current code before you send the check." };
  const files = await db.from("id_documents").select("kind,deleted_at,created_at").eq("agent_id", agentId).eq("check_id", text(found.row.id));
  if (files.error) return { error: "The files could not be checked." };
  const live = (files.data || []).filter((row) => !row.deleted_at);
  const kinds = new Set(live.map((row) => text(row.kind)));
  const missing = [
    ["id_front", "the front of the ID"],
    ["id_back", "the back of the ID"],
    ["licence", "the licence"],
    ["selfie_with_id", "a selfie holding the ID"],
  ].find(([kind]) => !kinds.has(kind));
  if (missing) return { error: `Add ${missing[1]} before you send the check.` };
  const issued = new Date(text(found.row.code_issued_at)).getTime();
  const currentCodeFile = live.some((row) => (text(row.kind) === "code_selfie" || text(row.kind) === "code_video") && new Date(text(row.created_at)).getTime() >= issued - 5000);
  if (!currentCodeFile) return { error: "Add a photo of the current code on paper, or a short clip of you saying that code." };
  const { error } = await db.from("keys_checks").update({
    status: "submitted",
    id_kind: idKind,
    id_number: idNumber,
    submitted_at: new Date().toISOString(),
    provider: "manual",
  }).eq("id", text(found.row.id)).eq("agent_id", agentId).eq("status", "collecting");
  if (error) return { error: "The check could not be sent." };
  return { ok: true };
}

function checklist(body: Record<string, unknown>) {
  return {
    name_matches: body.nameMatches === true,
    face_matches: body.faceMatches === true,
    code_matches: body.codeMatches === true,
    document_not_expired: body.documentNotExpired === true,
    licence_recorded: body.licenceRecorded === true,
    licence_expiry_ok: body.licenceExpiryOk === true,
  };
}

export async function adminKeysQueue() {
  const db = serviceDb();
  if (!db) return { error: "Keys Check could not be loaded." };
  const { data, error } = await db.from("keys_checks").select("*").in("status", ["submitted", "noted", "approved", "rejected"]).order("created_at", { ascending: false });
  if (missingTable(error)) return { ready: false, checks: [] };
  if (error) return { error: "Keys Check could not be loaded." };
  const ids = [...new Set((data || []).map((row) => text(row.agent_id)))];
  const names = new Map<string, string>();
  if (ids.length) {
    const people = await db.from("profiles").select("id,name").in("id", ids);
    for (const row of people.data || []) names.set(String(row.id), text(row.name) || "Agent");
  }
  const flags = await db.from("keys_check_flags").select("agent_id,flag,check_id");
  return {
    ready: true,
    checks: (data || []).map((row) => ({
      ...viewCheck(row as Row),
      agentId: text(row.agent_id),
      agentName: names.get(text(row.agent_id)) || "Agent",
      flags: (flags.data || []).filter((flag) => text(flag.agent_id) === text(row.agent_id)).map((flag) => flagSentence(text(flag.flag))).filter(Boolean),
    })),
  };
}

export async function adminKeysFiles(checkId: string) {
  const db = serviceDb();
  if (!db) return [];
  const { data } = await db.from("id_documents").select("id,kind,deleted_at,quality_note,sha256").eq("check_id", checkId).order("created_at", { ascending: true });
  return (data || []).filter((row) => !row.deleted_at).map((row) => ({
    id: text(row.id),
    kind: text(row.kind),
    label: documentLabel(text(row.kind)),
    qualityNote: text(row.quality_note),
    sha256: text(row.sha256),
  }));
}

async function audit(actorId: string, action: string, detail: string) {
  const db = serviceDb();
  if (!db) return false;
  const { error } = await db.from("audit_events").insert({ actor_id: actorId, action, detail });
  return !error;
}

export async function openKeysFiles(adminId: string, checkId: string) {
  const db = serviceDb();
  if (!db) return { error: "The files could not be opened." };
  const files = await adminKeysFiles(checkId);
  if (!files.length) return { error: "No file is stored for this check." };
  for (const file of files) {
    const recorded = await audit(adminId, "id_document_view", file.id);
    if (!recorded) return { error: "Could not record the view, so the file was not opened." };
  }
  const opened: { id: string; kind: string; label: string; url: string; qualityNote: string }[] = [];
  for (const file of files) {
    const row = await db.from("id_documents").select("storage_path").eq("id", file.id).maybeSingle();
    const signed = await db.storage.from(IDENTITY_BUCKET).createSignedUrl(text(row.data?.storage_path), 60);
    if (signed.error || !signed.data?.signedUrl) {
      const message = String(signed.error?.message || "").toLowerCase();
      if (message.includes("bucket") || message.includes("not found")) return { error: "The private identity bucket is not set up yet." };
      return { error: "The file could not be opened." };
    }
    opened.push({ id: file.id, kind: file.kind, label: file.label, url: signed.data.signedUrl, qualityNote: file.qualityNote });
  }
  return { files: opened, expiresIn: 60 };
}

export async function saveKeysNotes(reviewerName: string, body: Record<string, unknown>) {
  const db = serviceDb();
  if (!db) return { error: "The notes could not be saved." };
  const notes = text(body.notes).trim().slice(0, 2000);
  if (notes.length < 8) return { error: "Write a note before this step is saved." };
  const id = text(body.id);
  const { data } = await db.from("keys_checks").select("id,status").eq("id", id).maybeSingle();
  if (!data || !["submitted", "noted"].includes(text(data.status))) return { error: "Notes can be saved after the agent sends the check." };
  const { error } = await db.from("keys_checks").update({
    status: "noted",
    reviewer_name: reviewerName.slice(0, 160),
    reviewer_notes: notes,
    reviewed_at: new Date().toISOString(),
    ...checklist(body),
    provider: "manual",
  }).eq("id", id);
  if (error) return { error: "The notes could not be saved." };
  await audit(text(body.actorId), "keys_check_noted", id);
  return { ok: true };
}

export async function decideKeysCheck(adminName: string, adminId: string, body: Record<string, unknown>) {
  const db = serviceDb();
  if (!db) return { error: "The decision could not be saved." };
  const decision = text(body.decision);
  if (!["approve", "reject", "resubmit"].includes(decision)) return { error: "Choose approve, reject, or ask for the files again." };
  const reason = text(body.reason).trim().slice(0, 2000);
  if (reason.length < 8) return { error: "Write the reason for this decision." };
  const id = text(body.id);
  const { data } = await db.from("keys_checks").select("id,status,agent_id,reviewer_notes").eq("id", id).maybeSingle();
  if (!data) return { error: "That check was not found." };
  if (text(data.status) !== "noted" || !text(data.reviewer_notes)) return { error: "Save the review notes first. Approval is a second step." };
  const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "collecting";
  const { error } = await db.from("keys_checks").update({
    status,
    decision: decision === "resubmit" ? "resubmit" : decision,
    decision_reason: reason,
    decided_by: adminName.slice(0, 160),
    decided_at: new Date().toISOString(),
    ...(decision === "resubmit" ? { code: "", code_issued_at: null, submitted_at: null } : {}),
  }).eq("id", id).eq("status", "noted");
  if (error) return { error: "The decision could not be saved." };
  const identityStatus = decision === "approve" ? "checked" : decision === "reject" ? "rejected" : "pending";
  await db.from("agent_identity_checks").upsert({
    agent_id: text(data.agent_id),
    id_status: identityStatus,
    checked_by: decision === "approve" ? adminName.slice(0, 160) : "",
    checked_at: decision === "approve" ? new Date().toISOString() : null,
    notes: reason,
  });
  const recorded = await audit(adminId, `keys_check_${decision}`, id);
  if (!recorded) return { error: "The decision was saved, but the audit log could not be written." };
  return { ok: true };
}
