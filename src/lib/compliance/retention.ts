/** Stay false until Boss turns a retention review on. No scheduler is registered. */
export const RETENTION_REVIEW_ENABLED = false;

export const RETENTION_MONTHS = 24;
export const ID_CONSENT_VERSION = "2026-10-22";

export const idConsentText = [
  "Guyana Keys asks for a copy of your ID, and may ask for a photo of you, to check identity and a licence, to reduce fraud, and to keep Guyana Keys' own record of that check.",
  "The file is stored in a private bucket. It is not on a public link. An admin can open it for a short time, and that open is written to an audit log. Other agents cannot open it.",
  "It is kept while your account is active, and for 24 months after the account closes, unless you ask for it to be deleted sooner or the law requires a different period.",
  "You can ask to see the file or ask for it to be deleted. An admin carries out the deletion. The file is not used for marketing, and it is not sent to an AI model.",
  "A selfie box on this page only stores a file you choose. No liveness provider is connected.",
].join(" ");

export function retentionReviewJob() {
  if (!RETENTION_REVIEW_ENABLED) return { ran: false as const, reason: "disabled" as const };
  return { ran: true as const };
}
