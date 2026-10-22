/** Stay false until Boss turns a retention review on. No scheduler is registered. */
export const RETENTION_REVIEW_ENABLED = false;

export const RETENTION_MONTHS = 24;
export const ID_CONSENT_VERSION = "2026-10-22-keys";

export const idConsentText = [
  "Guyana Keys asks for photos of your ID, front and back, your licence, a selfie of you holding that ID, and either a photo of you holding a paper with a one-time code or a short video of you saying that code.",
  "A person at Guyana Keys looks at those files. No outside company checks them, and no software compares faces.",
  "The files are stored in a private bucket. They are not on a public link. An admin can open them for a short time, and that open is written to an audit log. Other agents cannot open them.",
  "They are kept while your account is active, and for 24 months after the account closes, unless you ask for them to be deleted sooner or the law requires a different period.",
  "You can ask to see the files or ask for them to be deleted. An admin carries out the deletion. The files are not used for marketing, and they are not sent to an AI model.",
].join(" ");

export function retentionReviewJob() {
  if (!RETENTION_REVIEW_ENABLED) return { ran: false as const, reason: "disabled" as const };
  return { ran: true as const };
}
