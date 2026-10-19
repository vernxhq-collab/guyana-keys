export const titleStatuses = [
  { id: "transport", label: "Transport", plain: "A transport is the deed that passes ownership. Have a Georgetown attorney search the Deeds Registry before any deposit." },
  { id: "certificate", label: "Certificate of Title", plain: "A certificate of title is registered proof of ownership. Have an attorney confirm it at the Land Registry before any deposit." },
  { id: "lease", label: "Lease", plain: "A lease is a right to occupy for a term. It is not the same as owning the land. Ask how long is left and who holds the transport." },
  { id: "unknown", label: "Unknown", plain: "Title status is not on this listing. Ask for the transport or certificate of title before any deposit." },
] as const;

export type TitleStatusId = (typeof titleStatuses)[number]["id"];

export function titleCopy(id: string | undefined) {
  return titleStatuses.find((item) => item.id === id) || titleStatuses[3];
}

export function cleanTitleStatus(value: unknown): TitleStatusId | "" {
  const id = String(value || "").trim();
  return titleStatuses.some((item) => item.id === id) ? (id as TitleStatusId) : "";
}
