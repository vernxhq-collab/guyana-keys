import { flagSentence, subjectLabel } from "./keys-check";
import {
  badgeMonth,
  evidenceRefError,
  isSenior,
  itemIsPriority,
  levelBadge,
  outcomeFrom,
  prepareLevelNotice,
  queueCounts,
  sortReviewItems,
  type AgentOutcome,
  type DecisionHistory,
  type LevelNoticeKind,
  type QueueId,
  type ReviewDeskData,
  type ReviewItem,
  type ReviewRole,
} from "./levels";
import { scanFlagSentences } from "./scan-flags";
import { serviceDb } from "./supabase";

type Row = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function missingTable(error: { message?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("schema cache") || message.includes("does not exist") || message.includes("could not find");
}

function asRole(value: string): ReviewRole | "" {
  if (value === "reviewer" || value === "senior_reviewer" || value === "admin") return value;
  return "";
}

async function maybeSendLevelNotice(input: { kind: LevelNoticeKind; to?: string; reason?: string; badge?: string }) {
  const prepared = prepareLevelNotice(input);
  if (!prepared.send) return prepared;
  return deliverLevelNotice(input.to || "", prepared.subject, prepared.text);
}

export async function deliverLevelNotice(to: string, subject: string, text: string) {
  const { sendEmail } = await import("./notify");
  const status = await sendEmail(to, subject, text);
  return { sent: status === "sent", reason: status, subject, text };
}

export function plainLevelError(message: string) {
  const textValue = message.toLowerCase();
  if (textValue.includes("own check")) return "You cannot decide your own check.";
  if (textValue.includes("reason is required")) return "Write the reason for this decision.";
  if (textValue.includes("senior reviewer")) return "This decision needs a senior reviewer.";
  if (textValue.includes("uploaded licence")) return "An uploaded licence image on its own does not complete this check.";
  if (textValue.includes("licence expiry")) return "Record the licence and its expiry before this check.";
  if (textValue.includes("reviewer role required")) return "Your account cannot make this decision.";
  if (textValue.includes("not an allowed step")) return "That step is not available from here.";
  if (textValue.includes("does not exist") || textValue.includes("could not find") || textValue.includes("schema cache")) return "The review desk is not ready yet.";
  return "That could not be saved.";
}

export async function loadReviewerAccess(userId: string) {
  const db = serviceDb();
  if (!db || !userId) return { offline: !db, missing: false, role: "" as ReviewRole | "", needsSetup: false };
  const { data, error } = await db.from("reviewer_roles").select("role").eq("user_id", userId).eq("marketplace_id", "gy").maybeSingle();
  if (missingTable(error)) return { offline: false, missing: true, role: "" as ReviewRole | "", needsSetup: false };
  const role = asRole(text(data?.role));
  const count = await db.from("reviewer_roles").select("user_id", { count: "exact", head: true }).eq("marketplace_id", "gy");
  const needsSetup = !role && !count.error && (count.count || 0) === 0;
  return { offline: false, missing: false, role, needsSetup };
}

function historyFor(rows: Row[], agentId: string): DecisionHistory[] {
  return rows
    .filter((row) => text(row.agent_id) === agentId)
    .slice(0, 8)
    .map((row) => ({ action: text(row.action), at: text(row.created_at), reason: text(row.reason) }));
}

function checklist(row: Row) {
  return {
    nameMatches: row.name_matches === true,
    faceMatches: row.face_matches === true,
    codeMatches: row.code_matches === true,
    documentNotExpired: row.document_not_expired === true,
    licenceRecorded: row.licence_recorded === true,
    licenceExpiryOk: row.licence_expiry_ok === true,
    reviewerNotes: text(row.reviewer_notes),
    idKind: text(row.id_kind),
    idNumberLast3: text(row.id_number_last3),
    code: text(row.code),
    subjectType: text(row.subject_type) || "agent",
  };
}

export async function loadReviewDesk(role: ReviewRole): Promise<ReviewDeskData & { error?: string }> {
  const db = serviceDb();
  if (!db) return { ready: false, role, queues: [], items: [], error: "Keys Check could not be loaded." };
  const [checks, flags, licences, status, reports, appeals] = await Promise.all([
    db.from("keys_checks").select("*").in("status", ["submitted", "noted"]),
    db.from("keys_check_flags").select("agent_id,check_id,flag"),
    db.from("agent_licences").select("*").eq("check_status", "pending"),
    db.from("verification_status").select("*").eq("marketplace_id", "gy"),
    db.from("customer_reports").select("*").eq("status", "open").order("created_at", { ascending: false }),
    db.from("appeals").select("*").eq("status", "open").order("created_at", { ascending: false }),
  ]);
  if ([checks.error, flags.error, licences.error, status.error, reports.error, appeals.error].some((error) => missingTable(error))) {
    return { ready: false, role, queues: [], items: [] };
  }
  if (checks.error || status.error) return { ready: false, role, queues: [], items: [], error: "Keys Check could not be loaded." };

  const items: ReviewItem[] = [];
  const agentIds = new Set<string>();
  const flagRows = (flags.data || []) as Row[];
  const statusRows = (status.data || []) as Row[];
  const soon = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  for (const row of (checks.data || []) as Row[]) {
    const agentId = text(row.agent_id);
    agentIds.add(agentId);
    const lines = [
      ...flagRows.filter((flag) => text(flag.agent_id) === agentId || text(flag.check_id) === text(row.id)).map((flag) => flagSentence(text(flag.flag))).filter(Boolean),
      ...scanFlagSentences(text(row.scan_flags)),
    ];
    const returned = text(row.info_requested_reason).length > 0;
    const queue: QueueId = returned ? "returned" : "level2";
    items.push({
      id: text(row.id),
      queue,
      agentId,
      agentName: "Agent",
      priority: itemIsPriority(lines),
      flags: lines,
      status: text(row.status),
      at: text(row.submitted_at) || text(row.created_at),
      summary: `${subjectLabel(text(row.subject_type)) || "Agent"} · ${text(row.status)} · ${text(row.id_kind) || "document not set"}`,
      reason: text(row.decision_reason) || text(row.info_requested_reason),
      applicationId: text(row.id),
      appealId: "",
      decisionId: "",
      statement: "",
      evidenceRef: "",
      history: [],
      checklist: checklist(row),
    });
  }

  for (const row of (licences.data || []) as Row[]) {
    const agentId = text(row.agent_id);
    agentIds.add(agentId);
    const level = statusRows.find((item) => text(item.agent_id) === agentId);
    items.push({
      id: text(row.id),
      queue: "licence",
      agentId,
      agentName: "Agent",
      priority: false,
      flags: [],
      status: text(row.check_status) || "pending",
      at: text(row.created_at),
      summary: text(level?.level) === "identity_reviewed" && text(level?.state) === "active"
        ? "ID review is active. The licence still needs a check with the issuing office."
        : "The ID review is not active yet, so this licence cannot be recorded.",
      reason: "",
      applicationId: "",
      appealId: "",
      decisionId: "",
      statement: "",
      evidenceRef: "",
      history: [],
      checklist: null,
    });
  }

  for (const row of (reports.data || []) as Row[]) {
    const agentId = text(row.target_agent_id);
    if (agentId) agentIds.add(agentId);
    items.push({
      id: text(row.id),
      queue: "reports",
      agentId,
      agentName: agentId ? "Agent" : "Report",
      priority: false,
      flags: [],
      status: "open",
      at: text(row.created_at),
      summary: text(row.reason),
      reason: text(row.reason),
      applicationId: "",
      appealId: "",
      decisionId: "",
      statement: "",
      evidenceRef: "",
      history: [],
      checklist: null,
    });
  }

  for (const row of (appeals.data || []) as Row[]) {
    const agentId = text(row.agent_id);
    agentIds.add(agentId);
    items.push({
      id: text(row.id),
      queue: "appeals",
      agentId,
      agentName: "Agent",
      priority: false,
      flags: [],
      status: "open",
      at: text(row.created_at),
      summary: text(row.statement),
      reason: "",
      applicationId: "",
      appealId: text(row.id),
      decisionId: text(row.decision_id),
      statement: text(row.statement),
      evidenceRef: "",
      history: [],
      checklist: null,
    });
  }

  for (const row of statusRows) {
    const recheck = text(row.recheck_at).slice(0, 10);
    const level = text(row.level);
    if (text(row.state) !== "active" || !recheck || recheck > soon) continue;
    if (level !== "identity_reviewed" && level !== "licensed_agent") continue;
    const agentId = text(row.agent_id);
    agentIds.add(agentId);
    items.push({
      id: `expiring-${agentId}`,
      queue: "expiring",
      agentId,
      agentName: "Agent",
      priority: recheck < new Date().toISOString().slice(0, 10),
      flags: [],
      status: text(row.state),
      at: recheck,
      summary: `Recheck by ${recheck}.`,
      reason: "",
      applicationId: "",
      appealId: "",
      decisionId: "",
      statement: "",
      evidenceRef: "",
      history: [],
      checklist: null,
    });
  }

  const ids = [...agentIds];
  const names = new Map<string, string>();
  if (ids.length) {
    const people = await db.from("profiles").select("id,name").in("id", ids);
    for (const row of people.data || []) names.set(text(row.id), text(row.name) || "Agent");
    const decisions = await db.from("verification_decisions").select("agent_id,action,reason,created_at").in("agent_id", ids).order("created_at", { ascending: false }).limit(200);
    const decisionRows = (decisions.data || []) as Row[];
    for (const item of items) {
      item.agentName = names.get(item.agentId) || item.agentName;
      item.history = historyFor(decisionRows, item.agentId);
    }
  }

  return { ready: true, role, needsSetup: false, queues: queueCounts(items), items: sortReviewItems(items) };
}

function noticeKind(action: string): LevelNoticeKind | "" {
  if (action === "approve") return "id_reviewed";
  if (action === "licence_approve") return "licence_checked";
  if (action === "request_info") return "more_info";
  if (action === "reject" || action === "suspend" || action === "revoke") return "not_approved";
  if (action === "appeal_upheld" || action === "appeal_denied") return "appeal_decided";
  return "";
}

async function agentEmail(agentId: string) {
  const db = serviceDb();
  if (!db || !agentId) return "";
  const { data } = await db.from("profiles").select("email").eq("id", agentId).maybeSingle();
  return text(data?.email);
}

export async function decideLevel(reviewerId: string, body: Record<string, unknown>) {
  const db = serviceDb();
  if (!db) return { error: "That could not be saved." };
  const action = text(body.decision || body.action);
  const reason = text(body.reason).trim().slice(0, 2000);
  if (action !== "expire" && reason.length < 8) return { error: "Write the reason for this decision." };
  const access = await loadReviewerAccess(reviewerId);
  if (access.offline) return { error: "That could not be saved." };
  if (access.missing) return { error: "The review desk is not ready yet." };
  if (!access.role) return { error: "Your account is not on the review desk yet." };
  const agentId = text(body.agentId);
  let errorMessage = "";

  if (action === "licence_approve" || action === "licence_reject") {
    if (!isSenior(access.role)) return { error: "This decision needs a senior reviewer." };
    const evidence = text(body.evidenceRef).trim().slice(0, 500);
    const method = text(body.method);
    if (action === "licence_approve") {
      const problem = evidenceRefError(evidence);
      if (problem) return { error: problem };
      if (!["issuer_email", "issuer_phone", "registry"].includes(method)) return { error: "Say how the office confirmed the licence." };
    }
    const result = await db.rpc("vf_licence_decide", {
      p_reviewer: reviewerId,
      p_agent: agentId,
      p_action: action === "licence_approve" ? "approve" : "reject",
      p_reason: reason,
      p_evidence: evidence,
      p_method: method || "issuer_email",
    });
    errorMessage = result.error?.message || "";
  } else if (action === "appeal_upheld" || action === "appeal_denied") {
    if (!isSenior(access.role)) return { error: "This decision needs a senior reviewer." };
    const result = await db.rpc("vf_decide_appeal", {
      p_reviewer: reviewerId,
      p_appeal: text(body.appealId),
      p_outcome: action,
      p_reason: reason,
    });
    errorMessage = result.error?.message || "";
  } else if (action === "handle_report") {
    const result = await db.rpc("vf_handle_report", { p_reviewer: reviewerId, p_report: text(body.id), p_reason: reason });
    errorMessage = result.error?.message || "";
  } else if (action === "expire") {
    if (!isSenior(access.role)) return { error: "This decision needs a senior reviewer." };
    const result = await db.rpc("vf_expire_due", { p_reviewer: reviewerId });
    errorMessage = result.error?.message || "";
  } else if (action === "approve" || action === "reject" || action === "request_info" || action === "suspend" || action === "revoke") {
    if ((action === "suspend" || action === "revoke") && !isSenior(access.role)) return { error: "This decision needs a senior reviewer." };
    const result = await db.rpc("vf_decide", {
      p_reviewer: reviewerId,
      p_application: text(body.applicationId),
      p_action: action,
      p_reason: reason,
      p_method: "manual",
      p_evidence: "",
      p_agent: agentId || null,
    });
    errorMessage = result.error?.message || "";
  } else {
    return { error: "That step is not available from here." };
  }

  if (errorMessage) return { error: plainLevelError(errorMessage) };
  const kind = noticeKind(action);
  if (kind) {
    const badge = action === "licence_approve"
      ? levelBadge("licensed_agent", "active", badgeMonth())
      : action === "approve"
        ? levelBadge("identity_reviewed", "active", badgeMonth())
        : "";
    await maybeSendLevelNotice({ kind, to: await agentEmail(agentId), reason, badge });
  }
  return { ok: true };
}

export async function grantSelfReviewer(actorId: string) {
  const db = serviceDb();
  if (!db) return { error: "That could not be saved." };
  const { error } = await db.rpc("vf_grant_role", { p_actor: actorId, p_user: actorId, p_role: "admin" });
  if (error) return { error: plainLevelError(error.message) };
  return { ok: true };
}

export async function openAppeal(agentId: string, statement: string, decisionId: string) {
  const db = serviceDb();
  if (!db) return { error: "The appeal could not be sent." };
  const note = statement.trim().slice(0, 2000);
  if (note.length < 8) return { error: "Write what we should look at again." };
  const { error } = await db.rpc("vf_open_appeal", {
    p_agent: agentId,
    p_statement: note,
    p_decision: decisionId || null,
  });
  if (error) return { error: plainLevelError(error.message) };
  await maybeSendLevelNotice({ kind: "appeal_received", to: await agentEmail(agentId) });
  return { ok: true };
}

export async function ensureRegistered(agentId: string) {
  const db = serviceDb();
  if (!db || !agentId) return;
  const { error } = await db.rpc("vf_ensure_registered", { p_agent: agentId });
  if (error && !missingTable(error)) return;
}

export async function loadAgentOutcome(agentId: string): Promise<AgentOutcome | null> {
  const db = serviceDb();
  if (!db || !agentId) return null;
  await ensureRegistered(agentId);
  const [status, decisions, licences, checks] = await Promise.all([
    db.from("verification_status").select("level,state,badge_month").eq("agent_id", agentId).eq("marketplace_id", "gy").maybeSingle(),
    db.from("verification_decisions").select("id,action,reason,created_at").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(8),
    db.from("agent_licences").select("check_status").eq("agent_id", agentId).eq("check_status", "pending"),
    db.from("keys_checks").select("status,info_requested_reason").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(1),
  ]);
  if (missingTable(status.error) || missingTable(decisions.error)) return null;
  const latest = (decisions.data || [])[0] as Row | undefined;
  const keys = (checks.data || [])[0] as Row | undefined;
  return outcomeFrom({
    level: text(status.data?.level),
    state: text(status.data?.state),
    badgeMonth: text(status.data?.badge_month),
    latestAction: text(latest?.action),
    latestReason: text(latest?.reason),
    decisionId: text(latest?.id),
    keysStatus: text(keys?.status),
    infoReason: text(keys?.info_requested_reason),
    licencePending: (licences.data || []).length > 0,
    history: ((decisions.data || []) as Row[]).map((row) => ({
      action: text(row.action),
      at: text(row.created_at),
      reason: text(row.reason),
    })),
  });
}
