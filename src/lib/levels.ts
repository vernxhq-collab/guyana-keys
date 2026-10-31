import { checkBadge, type BadgeLevel } from "./licences.ts";

/** Level status email stays off. No new email provider is used while this is false. */
export const LEVEL_STATUS_EMAILS_ENABLED = false;

export const SUPPORT_EMAIL = "info@gykeys.com";

export type ReviewRole = "reviewer" | "senior_reviewer" | "admin";
export type QueueId = "level2" | "returned" | "licence" | "reports" | "appeals" | "expiring";
export type OutcomeScreen = "none" | "more_info" | "id_reviewed" | "licence_check" | "not_approved" | "support";
export type LevelAction = "approve" | "reject" | "request_info" | "suspend" | "revoke";

export const QUEUES: { id: QueueId; label: string }[] = [
  { id: "level2", label: "New Level 2 submissions" },
  { id: "returned", label: "More information returned" },
  { id: "licence", label: "Level 3 licence checks" },
  { id: "reports", label: "Reports" },
  { id: "appeals", label: "Appeals" },
  { id: "expiring", label: "Expiring soon" },
];

export type DecisionHistory = { action: string; at: string; reason: string };

export type ReviewItem = {
  id: string;
  queue: QueueId;
  agentId: string;
  agentName: string;
  priority: boolean;
  flags: string[];
  status: string;
  at: string;
  summary: string;
  reason: string;
  applicationId: string;
  appealId: string;
  decisionId: string;
  statement: string;
  evidenceRef: string;
  history: DecisionHistory[];
  checklist: {
    nameMatches: boolean;
    faceMatches: boolean;
    codeMatches: boolean;
    documentNotExpired: boolean;
    licenceRecorded: boolean;
    licenceExpiryOk: boolean;
    reviewerNotes: string;
    idKind: string;
    idNumberLast3: string;
    code: string;
    subjectType: string;
  } | null;
};

export type ReviewDeskData = {
  ready: boolean;
  needsSetup?: boolean;
  role?: ReviewRole | "";
  queues: { id: QueueId; label: string; count: number }[];
  items: ReviewItem[];
};

export type AgentOutcome = {
  screen: OutcomeScreen;
  title: string;
  body: string;
  reason: string;
  badge: string;
  appealDecisionId: string;
  history: DecisionHistory[];
};

const MONTHS = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Oct|Nov|Dec) \d{4}$/;

export function badgeMonth(iso = new Date().toISOString()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function cleanBadgeMonth(value: string) {
  const month = value.trim().replace(/\s+/g, " ");
  return MONTHS.test(month) ? month : "";
}

/** Public line for a level row. Level 1 returns nothing. */
export function levelBadge(level: string, state: string, month: string) {
  if (level !== "identity_reviewed" && level !== "licensed_agent" && level !== "registered") return "";
  return checkBadge({
    level: level as BadgeLevel,
    state,
    badgeMonth: month,
    licences: [],
    today: new Date().toISOString().slice(0, 10),
  });
}

export function canOpenReviewDesk(input: { emailOnList: boolean; aal2: boolean; role: string }) {
  return input.emailOnList && input.aal2 && (input.role === "reviewer" || input.role === "senior_reviewer" || input.role === "admin");
}

export function isSenior(role: string) {
  return role === "senior_reviewer" || role === "admin";
}

export function itemIsPriority(flags: string[]) {
  return flags.some((flag) => /mismatch|duplicate|does not match|already stored/i.test(flag));
}

/** Flagged and mismatched rows sort above the rest. Newer rows follow within each group. */
export function sortReviewItems<T extends { priority: boolean; at: string }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    return (b.at || "").localeCompare(a.at || "");
  });
}

export function queueCounts(items: ReviewItem[]) {
  return QUEUES.map((queue) => ({ ...queue, count: items.filter((item) => item.queue === queue.id).length }));
}

export function evidenceRefError(value: string) {
  const text = value.trim();
  if (text.length < 12) return "Write how the licence was confirmed, including a reference.";
  if (/^(an )?(uploaded|upload|image|file|photo)([ .]+(image|file|photo|licence|license))*[. ]*$/i.test(text)) {
    return "An uploaded licence image on its own does not complete this check.";
  }
  if (/^(clean|quarantine)\//i.test(text) || /identity-documents/i.test(text)) {
    return "An uploaded licence image on its own does not complete this check.";
  }
  if (!/(\d|\bref\b|email|phone|confirmed|office|authority)/i.test(text)) {
    return "Include the office or message that confirmed the licence, and a reference.";
  }
  return "";
}

export function decisionLabel(action: string) {
  if (action === "approve") return "ID reviewed";
  if (action === "reject") return "Not approved";
  if (action === "request_info") return "More information needed";
  if (action === "suspend") return "Paused";
  if (action === "revoke") return "Badge removed";
  if (action === "expire") return "Check date passed";
  if (action === "appeal_upheld") return "Appeal upheld";
  if (action === "appeal_denied") return "Appeal not upheld";
  return "";
}

function thanks(text: string) {
  const body = text.trim();
  return body.endsWith("Thank you.") ? body : `${body}\n\nThank you.`;
}

export function outcomeFrom(input: {
  level?: string;
  state?: string;
  badgeMonth?: string;
  latestAction?: string;
  latestReason?: string;
  decisionId?: string;
  keysStatus?: string;
  infoReason?: string;
  licencePending?: boolean;
  history?: DecisionHistory[];
}): AgentOutcome {
  const level = input.level || "";
  const state = input.state || "";
  const reason = (input.latestReason || input.infoReason || "").trim();
  const badge = levelBadge(level, state || "active", input.badgeMonth || "");
  const history = input.history || [];
  const base = { reason, badge, appealDecisionId: "", history };

  if (state === "suspended" || state === "revoked" || state === "expired") {
    const screenReason = reason || "This check is paused.";
    return { ...base, screen: "not_approved", title: "Not approved or paused", reason: screenReason, appealDecisionId: input.decisionId || "", body: thanks(`${screenReason}\n\nIf you think this should be looked at again, use Appeal and tell us what we should know. You can also write to ${SUPPORT_EMAIL}.`) };
  }
  if (input.latestAction === "request_info" || (input.infoReason && input.keysStatus === "collecting")) {
    const screenReason = reason || "Please send the missing detail from this page.";
    return { ...base, screen: "more_info", title: "More information needed", reason: screenReason, body: thanks(`We need a little more before this check can continue.\n\n${screenReason}\n\nWhen you have it, send the files again from this page.`) };
  }
  if (input.latestAction === "reject" && level !== "identity_reviewed" && level !== "licensed_agent") {
    const screenReason = reason || "This check was not approved.";
    return { ...base, screen: "not_approved", title: "Not approved or paused", reason: screenReason, appealDecisionId: input.decisionId || "", body: thanks(`${screenReason}\n\nIf you think this should be looked at again, use Appeal and tell us what we should know. You can also write to ${SUPPORT_EMAIL}.`) };
  }
  if (level === "licensed_agent" && state === "active") {
    return { ...base, screen: "licence_check", title: "Licence check", body: thanks(`A person has checked your licence with the issuing office. The public line on your profile reads: ${badge || "Licence checked by Guyana Keys"}.`) };
  }
  if (input.licencePending && (level === "identity_reviewed" || level === "registered") && state === "active") {
    const line = badge ? ` The public line still reads: ${badge}.` : "";
    return { ...base, screen: "licence_check", title: "Licence check", body: thanks(`Your licence is in the queue for a person to check with the issuing office. An uploaded image on its own does not finish this check.${line}`) };
  }
  if (level === "identity_reviewed" && state === "active") {
    return { ...base, screen: "id_reviewed", title: "ID reviewed", body: thanks(`A person has reviewed your ID. The public line on your profile reads: ${badge || "ID reviewed by Guyana Keys"}. This is a review by Guyana Keys. It is not a government certificate.`) };
  }
  return { ...base, screen: "none", title: "", body: "" };
}

export function supportOutcome(): AgentOutcome {
  return {
    screen: "support",
    title: "Contact support",
    body: thanks(`Write to ${SUPPORT_EMAIL} and we will help.`),
    reason: "",
    badge: "",
    appealDecisionId: "",
    history: [],
  };
}

export type LevelNoticeKind = "received" | "more_info" | "id_reviewed" | "licence_checked" | "not_approved" | "appeal_received" | "appeal_decided";

export function levelNotice(kind: LevelNoticeKind, input: { reason?: string; badge?: string } = {}) {
  const reason = (input.reason || "").trim();
  const badge = (input.badge || "").trim();
  if (kind === "received") {
    return { subject: "We've got your details", text: thanks("We've got your details. A person will check them.") };
  }
  if (kind === "more_info") {
    return { subject: "More information needed", text: thanks(`We need a little more before this check can continue.\n\n${reason || "Please sign in and send the missing detail."}`) };
  }
  if (kind === "id_reviewed") {
    return { subject: "ID reviewed", text: thanks(`A person has reviewed your ID. The public line reads: ${badge || "ID reviewed by Guyana Keys"}.`) };
  }
  if (kind === "licence_checked") {
    return { subject: "Licence check", text: thanks(`A person has checked your licence. The public line reads: ${badge || "Licence checked by Guyana Keys"}.`) };
  }
  if (kind === "appeal_received") {
    return { subject: "Appeal received", text: thanks("We've got your appeal. A senior reviewer will look at it.") };
  }
  if (kind === "appeal_decided") {
    return { subject: "Your appeal", text: thanks(reason || "A senior reviewer has looked at your appeal. Sign in to read the outcome.") };
  }
  return { subject: "Not approved or paused", text: thanks(`${reason || "This check was not approved."}\n\nIf you think this should be looked at again, sign in and use Appeal. You can also write to ${SUPPORT_EMAIL}.`) };
}

/** Browser-safe. The desk sends only when this says so, and the flag is off. */
export function prepareLevelNotice(input: { kind: LevelNoticeKind; to?: string; reason?: string; badge?: string }) {
  const message = levelNotice(input.kind, { reason: input.reason, badge: input.badge });
  if (!LEVEL_STATUS_EMAILS_ENABLED || !input.to) {
    return { send: false as const, reason: "disabled" as const, subject: message.subject, text: message.text };
  }
  return { send: true as const, reason: "ready" as const, subject: message.subject, text: message.text };
}

export async function sendLevelNotice(input: { kind: LevelNoticeKind; to?: string; reason?: string; badge?: string }) {
  const prepared = prepareLevelNotice(input);
  return { sent: false as const, reason: prepared.send ? "ready" as const : "disabled" as const, subject: prepared.subject, text: prepared.text };
}
