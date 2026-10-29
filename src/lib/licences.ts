export const LICENCE_TYPES = ["gra_house_agent", "reaba_professional"] as const;
export type LicenceType = (typeof LICENCE_TYPES)[number];
export type CheckStatus = "pending" | "checked" | "rejected" | "expired";

export function licenceLabel(type: string) {
  if (type === "gra_house_agent") return "GRA House Agent licence";
  if (type === "reaba_professional") return "REABA professional licence";
  return "";
}

export function expireStatus(status: string, expiry: string | null, today: string): CheckStatus {
  const current: CheckStatus = status === "checked" || status === "rejected" || status === "expired" ? status : "pending";
  if (current === "rejected") return current;
  if (expiry && expiry < today) return "expired";
  return current;
}

function monthLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function joinParts(parts: string[]) {
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/** Public badge. Returns nothing when no current check remains. Never the word Verified. */
export function checkBadge(input: {
  idStatus?: string;
  idCheckedAt?: string | null;
  licences: { type: string; status: string; checkedAt?: string | null; expiry?: string | null }[];
  today: string;
}) {
  const parts: string[] = [];
  const dates: string[] = [];
  const idReviewed = input.idStatus === "checked" && Boolean(input.idCheckedAt);
  if (idReviewed && input.idCheckedAt) dates.push(input.idCheckedAt);
  for (const licence of input.licences) {
    const status = expireStatus(licence.status, licence.expiry || null, input.today);
    const label = licenceLabel(licence.type);
    if (status === "checked" && label) {
      parts.push(label);
      if (licence.checkedAt) dates.push(licence.checkedAt);
    }
  }
  if (!parts.length && !idReviewed) return "";
  const when = monthLabel(dates.sort().at(-1) || "");
  // Boss chose "ID reviewed" on 29 Oct 2026. Licences keep "checked".
  const stem = !parts.length
    ? "ID reviewed by Guyana Keys"
    : idReviewed
      ? `ID reviewed and ${joinParts(parts)} checked by Guyana Keys`
      : `${joinParts(parts)} checked by Guyana Keys`;
  return when ? `${stem} · ${when}` : stem;
}
