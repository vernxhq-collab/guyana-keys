/** Stay false until Boss turns a retention review on. No scheduler is registered. */
export const RETENTION_REVIEW_ENABLED = false;

export const RETENTION_MONTHS = 24;
export const ID_CONSENT_VERSION = "2026-10-31-keys";

export const idConsentText = [
  "Guyana Keys asks for photos of your ID, front and back, your licence, a selfie of you holding that ID, and a photo of the one-time code on paper or on another screen, so a person here can look at them before a check is recorded.",
  "Guyana Keys looks after this information.",
  "A person at Guyana Keys looks at those files. No outside company checks them, and no software compares faces.",
  "Reading the words on the document happens on this device. The photos are not sent to another company, and they are not sent to an AI model.",
  "The files are stored in a private bucket. They are not on a public link. An admin can open them for a short time, and that open is written to an audit log. Other agents cannot open them.",
  "They are kept while your account is active, and for 24 months after the account closes, unless you ask for them to be deleted sooner or the law requires a different period.",
  "You can ask to see the files or ask for them to be deleted. An admin carries out the deletion. The files are not used for marketing.",
  "You can withdraw consent at any time by emailing info@gykeys.com. If you do, the check stops and your images are deleted under the retention rules.",
].join(" ");

export function retentionReviewJob() {
  if (!RETENTION_REVIEW_ENABLED) return { ran: false as const, reason: "disabled" as const };
  return { ran: true as const };
}
