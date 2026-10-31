import { newId } from "./labels";
import { hashIdNumber, idNumberLast3, normaliseIdNumber } from "./id-number";
import { ID_KINDS, type IdKind } from "./keys-check";
import { claimAllowed, hashScanSecret, newScanSecret, remainingSeconds, scanExpiry } from "./phone-token";
import { joinScanFlags, scanFlagSentences, scanFlags, type ScanFlag } from "./scan-flags";
import { serviceDb } from "./supabase";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function missingTable(error: { message?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("schema cache") || message.includes("does not exist") || message.includes("could not find") || message.includes("scan_name") || message.includes("scan_flags") || message.includes("phone_scan");
}

async function audit(actorId: string, action: string, detail: string) {
  const db = serviceDb();
  if (!db) return false;
  const { error } = await db.from("audit_events").insert({ actor_id: actorId, action, detail });
  return !error;
}

async function openCheck(agentId: string) {
  const db = serviceDb();
  if (!db) return { db: null, row: null as Record<string, unknown> | null, missing: false };
  const { data, error } = await db.from("keys_checks").select("*").eq("agent_id", agentId).eq("subject_type", "agent").order("created_at", { ascending: false }).limit(1);
  if (missingTable(error)) return { db, row: null, missing: true };
  return { db, row: (data?.[0] as Record<string, unknown> | undefined) || null, missing: false };
}

export async function loadPhoneScan(agentId: string) {
  const found = await openCheck(agentId);
  if (!found.db || found.missing) return { ready: false as const };
  const documents = await found.db.from("id_documents").select("kind,deleted_at").eq("agent_id", agentId).eq("check_id", text(found.row?.id));
  const kinds = (documents.data || []).filter((row) => !row.deleted_at).map((row) => text(row.kind));
  const flags = text(found.row?.scan_flags);
  return {
    ready: true as const,
    idKind: text(found.row?.id_kind),
    name: text(found.row?.scan_name),
    expiry: text(found.row?.scan_expiry),
    idNumberLast3: text(found.row?.id_number_last3),
    status: text(found.row?.status) || "collecting",
    code: text(found.row?.code),
    codeIssuedAt: text(found.row?.code_issued_at),
    flags,
    flagSentences: scanFlagSentences(flags),
    documents: kinds,
  };
}

export async function savePhoneDraft(agentId: string, body: Record<string, unknown>, today: string) {
  const found = await openCheck(agentId);
  if (!found.db) return { error: "The check could not be saved." };
  if (found.missing) return { error: "Phone scan is not ready on this desk yet." };
  const idKind = text(body.idKind);
  if (idKind && !ID_KINDS.includes(idKind as IdKind)) return { error: "Choose national ID, passport, or driver's licence." };
  const name = text(body.name).trim().slice(0, 120);
  const expiry = /^\d{4}-\d{2}-\d{2}$/.test(text(body.expiry)) ? text(body.expiry) : "";
  const number = normaliseIdNumber(text(body.idNumber));
  let idNumberHmac = "";
  if (number) {
    idNumberHmac = hashIdNumber(number);
    if (!idNumberHmac) return { error: "The ID number cannot be stored on this desk yet. Try again later." };
  }
  const checksum = body.checksum === "ok" || body.checksum === "failed" ? body.checksum : "none";
  const flags = scanFlags({
    confirmedName: name,
    readName: text(body.readName),
    confirmedNumber: number,
    readNumber: normaliseIdNumber(text(body.readNumber)),
    expiry,
    today,
    checksum,
    readFailed: body.readFailed === true,
  });
  let row = found.row;
  if (!row || text(row.status) === "approved" || text(row.status) === "rejected") {
    const createdId = newId("chk");
    const created = await found.db.from("keys_checks").insert({
      id: createdId,
      agent_id: agentId,
      subject_type: "agent",
      status: "collecting",
      provider: "manual",
    });
    if (created.error) {
      if (missingTable(created.error)) return { error: "Phone scan is not ready on this desk yet." };
      return { error: "The check could not be saved." };
    }
    row = { id: createdId, status: "collecting" };
  }
  if (text(row.status) !== "collecting") return { error: "This check is already with a reviewer." };
  const update: Record<string, string> = {
    scan_name: name,
    scan_expiry: expiry,
    scan_flags: joinScanFlags(flags),
    provider: "manual",
  };
  if (idKind) update.id_kind = idKind;
  if (idNumberHmac) {
    update.id_number_hmac = idNumberHmac;
    update.id_number_last3 = idNumberLast3(number);
  }
  const { error } = await found.db.from("keys_checks").update(update).eq("id", text(row.id)).eq("agent_id", agentId).eq("status", "collecting");
  if (error) {
    if (missingTable(error)) return { error: "Phone scan is not ready on this desk yet." };
    return { error: "The check could not be saved." };
  }
  return { ok: true as const, flags, flagSentences: flags.map((flag) => scanFlagSentences(flag)).flat() };
}

export async function issuePhoneToken(agentId: string, origin: string) {
  const db = serviceDb();
  if (!db) return { error: "The phone link could not be made." };
  const token = newScanSecret();
  const id = newId("phn");
  const expiresAt = scanExpiry();
  const { error } = await db.from("phone_scan_tokens").insert({
    id,
    agent_id: agentId,
    token_hash: hashScanSecret(token),
    expires_at: expiresAt,
  });
  if (error) {
    if (missingTable(error)) return { error: "Continuing on a phone is not ready on this desk yet." };
    return { error: "The phone link could not be made." };
  }
  const recorded = await audit(agentId, "phone_scan_issued", id);
  if (!recorded) return { error: "The phone link could not be written to the audit log." };
  return { ok: true as const, url: `${origin}/scan#t=${token}`, expiresAt };
}

export async function claimPhoneToken(token: string) {
  const db = serviceDb();
  if (!db || token.length < 20) return { error: "This phone link is not valid." };
  const hashed = hashScanSecret(token);
  const { data, error } = await db.from("phone_scan_tokens").select("id,agent_id,expires_at,used_at").eq("token_hash", hashed).maybeSingle();
  if (error) {
    if (missingTable(error)) return { error: "Continuing on a phone is not ready on this desk yet." };
    return { error: "This phone link is not valid." };
  }
  if (!data || !claimAllowed({ usedAt: text(data.used_at), expiresAt: text(data.expires_at) })) {
    return { error: "This phone link has expired or has already been used." };
  }
  const session = newScanSecret();
  const { data: claimed, error: updateError } = await db.from("phone_scan_tokens").update({
    used_at: new Date().toISOString(),
    session_hash: hashScanSecret(session),
  }).eq("id", text(data.id)).is("used_at", null).select("id,expires_at").maybeSingle();
  if (updateError || !claimed) return { error: "This phone link has expired or has already been used." };
  const recorded = await audit(text(data.agent_id), "phone_scan_claimed", text(data.id));
  if (!recorded) return { error: "The phone link could not be written to the audit log." };
  return {
    ok: true as const,
    session,
    agentId: text(data.agent_id),
    maxAge: remainingSeconds(text(claimed.expires_at)),
  };
}

export async function agentFromPhoneSession(session: string) {
  const db = serviceDb();
  if (!db || session.length < 20) return "";
  const { data } = await db.from("phone_scan_tokens").select("agent_id,expires_at,used_at").eq("session_hash", hashScanSecret(session)).maybeSingle();
  if (!data || !text(data.used_at)) return "";
  if (new Date(text(data.expires_at)).getTime() <= Date.now()) return "";
  return text(data.agent_id);
}

export type { ScanFlag };
