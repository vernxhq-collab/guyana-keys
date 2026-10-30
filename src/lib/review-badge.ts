import { SUBJECT_TYPES, type SubjectType } from "./keys-check.ts";

/** What a person at Guyana Keys looked at. Public text says "reviewed" or "checked", never the v-word. */
export type ReviewKind = "id";

export function reviewMonth(iso: string) {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

/**
 * Public badge text: "ID reviewed by Guyana Keys · Mon YYYY".
 * The same text serves any subject type (agent now, others later).
 * Returns "" when there is no current review, so nothing is shown.
 */
export function reviewBadgeText(input: { kind: ReviewKind; status: string; reviewedAt?: string | null; subjectType?: SubjectType }) {
  if (input.subjectType && !(SUBJECT_TYPES as readonly string[]).includes(input.subjectType)) return "";
  if (input.status !== "checked" && input.status !== "approved") return "";
  const when = reviewMonth(input.reviewedAt || "");
  if (!when) return "";
  return `ID reviewed by Guyana Keys · ${when}`;
}
