export const titleStatuses = [
  { id: "transport", label: "Transport", plain: "A transport is the deed that passes ownership. Have an attorney search the Deeds Registry before any deposit." },
  { id: "certificate_of_title", label: "Certificate of Title", plain: "A certificate of title is registered proof of ownership. Have an attorney confirm it at the Land Registry before any deposit." },
  { id: "lease", label: "Lease", plain: "A lease is a right to occupy for a term. It is not the same as owning the land. Ask how long is left and who holds the transport." },
  { id: "other", label: "Other", plain: "The agent or owner described the title in another way. Ask which document they hold, and have an attorney check it before any deposit." },
  { id: "unknown", label: "Unknown", plain: "Title status is not on this listing. Ask for the transport or certificate of title before any deposit." },
] as const;

export type TitleStatusId = (typeof titleStatuses)[number]["id"];

export function titleCopy(id: string | undefined) {
  if (id === "certificate") return titleStatuses[1];
  return titleStatuses.find((item) => item.id === id) || titleStatuses[4];
}

export function cleanTitleStatus(value: unknown): TitleStatusId | "" {
  const id = String(value || "").trim() === "certificate" ? "certificate_of_title" : String(value || "").trim();
  return titleStatuses.some((item) => item.id === id) ? (id as TitleStatusId) : "";
}

export function titleStatement(checkedByLawyer: boolean) {
  return checkedByLawyer ? "Checked with a lawyer partner" : "Stated by agent/owner";
}
