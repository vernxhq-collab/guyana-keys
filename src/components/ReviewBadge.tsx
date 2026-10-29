import { reviewBadgeText, type ReviewKind } from "../lib/review-badge";
import type { SubjectType } from "../lib/keys-check";

/** Small public chip. Renders nothing unless a person at Guyana Keys has a current review on file. */
export function ReviewBadge({ kind = "id", status, reviewedAt, subjectType = "agent" }: { kind?: ReviewKind; status: string; reviewedAt?: string | null; subjectType?: SubjectType }) {
  const text = reviewBadgeText({ kind, status, reviewedAt, subjectType });
  if (!text) return null;
  return (
    <p className="chip review-badge" title="A person at Guyana Keys looked at the ID. This is not a government check.">
      {text}
    </p>
  );
}
