import { checkBadge, expireStatus, licenceLabel, LICENCE_TYPES, type LicenceType } from "./licences";
import { newId } from "./labels";
import { publishedRates, type MortgageRate } from "./rates";
import { ID_CONSENT_VERSION, RETENTION_MONTHS } from "./compliance/retention";
import { serviceDb } from "./supabase";

type Row = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function missingTable(error: { message?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("schema cache") || message.includes("does not exist") || message.includes("could not find");
}

function dateOrNull(value: unknown) {
  const raw = text(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

async function flagExpired(rows: Row[]) {
  const db = serviceDb();
  const today = todayUtc();
  for (const row of rows) {
    const next = expireStatus(text(row.check_status), text(row.expiry_date) || null, today);
    if (next === "expired" && text(row.check_status) !== "expired") {
      row.check_status = "expired";
      if (db) await db.from("agent_licences").update({ check_status: "expired" }).eq("id", text(row.id));
    }
  }
}

export async function badgesFor(agentIds: string[]) {
  const badges: Record<string, string> = {};
  const db = serviceDb();
  const ids = agentIds.filter(Boolean);
  if (!db || !ids.length) return badges;
  const [licences, identity] = await Promise.all([
    db.from("agent_licences").select("id,agent_id,licence_type,check_status,checked_at,expiry_date").in("agent_id", ids),
    db.from("agent_identity_checks").select("agent_id,id_status,checked_at").in("agent_id", ids),
  ]);
  if (licences.error || identity.error) return badges;
  const today = todayUtc();
  await flagExpired((licences.data || []) as Row[]);
  for (const id of ids) {
    const own = (licences.data || []).filter((row) => String(row.agent_id) === id);
    const idRow = (identity.data || []).find((row) => String(row.agent_id) === id);
    badges[id] = checkBadge({
      idStatus: idRow ? text(idRow.id_status) : "",
      idCheckedAt: idRow ? text(idRow.checked_at) : "",
      licences: own.map((row) => ({
        type: text(row.licence_type),
        status: text(row.check_status),
        checkedAt: text(row.checked_at),
        expiry: text(row.expiry_date),
      })),
      today,
    });
  }
  return badges;
}

export async function agentChecks(agentId: string) {
  const db = serviceDb();
  if (!db) return { error: "Checks could not be loaded." };
  const [licences, identity, documents] = await Promise.all([
    db.from("agent_licences").select("*").eq("agent_id", agentId),
    db.from("agent_identity_checks").select("*").eq("agent_id", agentId).maybeSingle(),
    db.from("id_documents").select("id,kind,created_at,deleted_at,consent_version,consent_at").eq("agent_id", agentId).order("created_at", { ascending: false }),
  ]);
  if (missingTable(licences.error) || missingTable(identity.error)) {
    return { ready: false, licences: [], identity: null, documents: [], consentVersion: ID_CONSENT_VERSION };
  }
  const rows = (licences.data || []) as Row[];
  await flagExpired(rows);
  return {
    ready: true,
    consentVersion: ID_CONSENT_VERSION,
    licences: rows.map(licenceView),
    identity: identity.data ? {
      status: text(identity.data.id_status) || "pending",
      checkedAt: text(identity.data.checked_at),
      notes: text(identity.data.notes),
    } : null,
    documents: documents.error ? [] : (documents.data || []).map((row) => ({
      id: text(row.id),
      kind: text(row.kind),
      createdAt: text(row.created_at),
      deletedAt: text(row.deleted_at),
      consentVersion: text(row.consent_version),
    })),
  };
}

function licenceView(row: Row) {
  return {
    id: text(row.id),
    agentId: text(row.agent_id),
    type: text(row.licence_type),
    label: licenceLabel(text(row.licence_type)),
    issuingBody: text(row.issuing_body),
    number: text(row.licence_number),
    issueDate: text(row.issue_date).slice(0, 10),
    expiry: text(row.expiry_date).slice(0, 10),
    status: text(row.check_status) || "pending",
    checkedBy: text(row.checked_by),
    checkedAt: text(row.checked_at),
    notes: text(row.notes),
  };
}

export async function saveAgentLicence(agentId: string, body: Record<string, unknown>) {
  const db = serviceDb();
  if (!db) return { error: "The licence could not be saved." };
  const type = text(body.licenceType);
  if (!LICENCE_TYPES.includes(type as LicenceType)) return { error: "Choose a GRA House Agent licence or a REABA professional licence." };
  const number = text(body.licenceNumber).trim().slice(0, 80);
  if (number.length < 2) return { error: "Enter the licence number." };
  const row = {
    id: `lic-${agentId}-${type}`,
    agent_id: agentId,
    licence_type: type,
    issuing_body: text(body.issuingBody).trim().slice(0, 160),
    licence_number: number,
    issue_date: dateOrNull(body.issueDate),
    expiry_date: dateOrNull(body.expiryDate),
    check_status: "pending",
    checked_by: "",
    checked_at: null,
    notes: "",
  };
  const { error } = await db.from("agent_licences").upsert(row, { onConflict: "agent_id,licence_type" });
  if (missingTable(error)) return { error: "Licence checks are not ready on this desk yet." };
  if (error) return { error: "The licence could not be saved." };
  return { ok: true };
}

async function namesFor(ids: string[]) {
  const db = serviceDb();
  const names = new Map<string, string>();
  if (!db || !ids.length) return names;
  const { data } = await db.from("profiles").select("id,name").in("id", ids);
  for (const row of data || []) names.set(String(row.id), text(row.name) || "Agent");
  return names;
}

export async function adminCheckQueue() {
  const db = serviceDb();
  if (!db) return { error: "Checks could not be loaded." };
  const [licences, identity, documents, deletions] = await Promise.all([
    db.from("agent_licences").select("*").order("created_at", { ascending: false }),
    db.from("agent_identity_checks").select("*"),
    db.from("id_documents").select("id,agent_id,kind,created_at,deleted_at").order("created_at", { ascending: false }),
    db.from("id_deletion_requests").select("*").order("created_at", { ascending: false }),
  ]);
  if (missingTable(licences.error)) return { ready: false, licences: [], identities: [], documents: [], deletions: [] };
  const licenceRows = (licences.data || []) as Row[];
  await flagExpired(licenceRows);
  const ids = [
    ...licenceRows.map((row) => text(row.agent_id)),
    ...(identity.data || []).map((row) => text(row.agent_id)),
    ...(documents.data || []).map((row) => text(row.agent_id)),
    ...(deletions.data || []).map((row) => text(row.agent_id)),
  ];
  const names = await namesFor([...new Set(ids)]);
  return {
    ready: true,
    licences: licenceRows.map((row) => ({ ...licenceView(row), agentName: names.get(text(row.agent_id)) || "Agent" })),
    identities: (identity.data || []).map((row) => ({
      agentId: text(row.agent_id),
      agentName: names.get(text(row.agent_id)) || "Agent",
      status: text(row.id_status) || "pending",
      checkedAt: text(row.checked_at),
      notes: text(row.notes),
    })),
    documents: documents.error ? [] : (documents.data || []).map((row) => ({
      id: text(row.id),
      agentId: text(row.agent_id),
      agentName: names.get(text(row.agent_id)) || "Agent",
      kind: text(row.kind),
      createdAt: text(row.created_at),
      deletedAt: text(row.deleted_at),
    })),
    deletions: deletions.error ? [] : (deletions.data || []).map((row) => ({
      id: text(row.id),
      agentId: text(row.agent_id),
      agentName: names.get(text(row.agent_id)) || "Agent",
      documentId: text(row.document_id),
      status: text(row.status),
      note: text(row.note),
      createdAt: text(row.created_at),
    })),
  };
}

export async function reviewLicence(adminName: string, body: Record<string, unknown>) {
  const db = serviceDb();
  if (!db) return { error: "The check could not be saved." };
  const status = text(body.status);
  if (!["pending", "checked", "rejected", "expired"].includes(status)) return { error: "Choose a check status." };
  const id = text(body.id);
  const patch: Record<string, unknown> = {
    check_status: status,
    notes: text(body.notes).slice(0, 2000),
    checked_by: status === "pending" ? "" : adminName.slice(0, 160),
    checked_at: status === "pending" ? null : new Date().toISOString(),
  };
  const { error } = await db.from("agent_licences").update(patch).eq("id", id);
  if (missingTable(error)) return { error: "Licence checks are not ready on this desk yet." };
  if (error) return { error: "The check could not be saved." };
  return { ok: true };
}

export async function reviewIdentity(adminName: string, body: Record<string, unknown>) {
  const db = serviceDb();
  if (!db) return { error: "The ID check could not be saved." };
  const status = text(body.status);
  if (!["pending", "checked", "rejected"].includes(status)) return { error: "Choose a check status." };
  const agentId = text(body.agentId);
  if (!agentId) return { error: "Choose an agent." };
  const { error } = await db.from("agent_identity_checks").upsert({
    agent_id: agentId,
    id_status: status,
    notes: text(body.notes).slice(0, 2000),
    checked_by: status === "pending" ? "" : adminName.slice(0, 160),
    checked_at: status === "pending" ? null : new Date().toISOString(),
  });
  if (missingTable(error)) return { error: "ID checks are not ready on this desk yet." };
  if (error) return { error: "The ID check could not be saved." };
  return { ok: true };
}

export async function requestIdDeletion(agentId: string, documentId: string, note: string) {
  const db = serviceDb();
  if (!db) return { error: "The deletion request could not be saved." };
  const { data } = await db.from("id_documents").select("id").eq("id", documentId).eq("agent_id", agentId).maybeSingle();
  if (!data) return { error: "That file was not found on your account." };
  const { error } = await db.from("id_deletion_requests").insert({
    id: newId("del"),
    agent_id: agentId,
    document_id: documentId,
    status: "requested",
    note: note.slice(0, 500),
  });
  if (missingTable(error)) return { error: "Deletion requests are not ready on this desk yet." };
  if (error) return { error: "The deletion request could not be saved." };
  return { ok: true };
}

async function audit(actorId: string, action: string, detail: string) {
  const db = serviceDb();
  if (!db) return false;
  const { error } = await db.from("audit_events").insert({ actor_id: actorId, action, detail });
  return !error;
}

export async function openIdentityFile(adminId: string, documentId: string, download: boolean) {
  const db = serviceDb();
  if (!db) return { error: "The file could not be opened." };
  const { data, error } = await db.from("id_documents").select("id,storage_path,deleted_at").eq("id", documentId).maybeSingle();
  if (error || !data) return { error: "That file was not found." };
  if (data.deleted_at) return { error: "That file has been deleted." };
  const recorded = await audit(adminId, download ? "id_document_download" : "id_document_view", documentId);
  if (!recorded) return { error: "Could not record the view, so the file was not opened." };
  const signed = await db.storage.from("identity-documents").createSignedUrl(text(data.storage_path), 60);
  if (signed.error || !signed.data?.signedUrl) {
    const message = String(signed.error?.message || "").toLowerCase();
    if (message.includes("bucket") || message.includes("not found")) return { error: "The private identity bucket is not set up yet." };
    return { error: "The file could not be opened." };
  }
  return { url: signed.data.signedUrl, expiresIn: 60 };
}

export async function purgeIdentityFile(adminId: string, documentId: string) {
  const db = serviceDb();
  if (!db) return { error: "The file could not be deleted." };
  const { data } = await db.from("id_documents").select("id,storage_path,deleted_at").eq("id", documentId).maybeSingle();
  if (!data) return { error: "That file was not found." };
  if (!data.deleted_at) {
    const removed = await db.storage.from("identity-documents").remove([text(data.storage_path)]);
    if (removed.error) {
      const message = String(removed.error.message || "").toLowerCase();
      if (message.includes("bucket")) return { error: "The private identity bucket is not set up yet." };
      return { error: "The file could not be deleted." };
    }
    const { error } = await db.from("id_documents").update({ deleted_at: new Date().toISOString() }).eq("id", documentId);
    if (error) return { error: "The file record could not be closed." };
  }
  await db.from("id_deletion_requests").update({ status: "purged" }).eq("document_id", documentId).eq("status", "requested");
  const recorded = await audit(adminId, "id_document_purge", documentId);
  if (!recorded) return { error: "The file was removed, but the audit log could not be written. Tell the admin before opening another file." };
  return { ok: true };
}

export async function declineDeletion(adminId: string, requestId: string) {
  const db = serviceDb();
  if (!db) return { error: "The request could not be updated." };
  const { error } = await db.from("id_deletion_requests").update({ status: "declined" }).eq("id", requestId).eq("status", "requested");
  if (error) return { error: "The request could not be updated." };
  await audit(adminId, "id_deletion_declined", requestId);
  return { ok: true };
}

export type PublicPartner = { id: string; name: string; category: string; area: string; phone: string; email: string; note: string };

export async function publicPartners(): Promise<PublicPartner[]> {
  const db = serviceDb();
  if (!db) return [];
  const { data, error } = await db.from("partners").select("id,name,category,area,phone,email,note,consent_to_list").eq("consent_to_list", true);
  if (error || !data) return [];
  return data
    .filter((row) => row.consent_to_list === true)
    .map((row) => ({
      id: text(row.id),
      name: text(row.name),
      category: text(row.category),
      area: text(row.area),
      phone: text(row.phone),
      email: text(row.email),
      note: text(row.note),
    }))
    .filter((row) => row.name);
}

export async function loadMortgageRates(): Promise<MortgageRate[]> {
  const db = serviceDb();
  if (!db) return publishedRates;
  const { data, error } = await db.from("mortgage_rates").select("id,bank,product,rate,source_url,checked_on");
  if (error || !data?.length) return publishedRates;
  return data.map((row) => ({
    id: text(row.id),
    bank: text(row.bank),
    product: text(row.product),
    rate: Number(row.rate),
    sourceUrl: text(row.source_url),
    checkedOn: text(row.checked_on).slice(0, 10),
  })).filter((row) => row.bank && Number.isFinite(row.rate) && row.sourceUrl);
}

export const IDENTITY_BUCKET = "identity-documents";
export { ID_CONSENT_VERSION, RETENTION_MONTHS };
