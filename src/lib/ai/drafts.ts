export type DraftStatus = "draft" | "approved" | "sent";
export type DraftChannel = "email" | "whatsapp";

export function nextDraftStatus(current: DraftStatus, action: "approve" | "send"): DraftStatus | null {
  if (action === "approve" && current === "draft") return "approved";
  if (action === "send" && current === "approved") return "sent";
  return null;
}
