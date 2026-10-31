/** Hints for a person who reviews a Keys Check. Nothing here approves a check. */

export const SCAN_FLAGS = ["scan_unread", "scan_checksum", "scan_expired", "scan_mismatch"] as const;
export type ScanFlag = (typeof SCAN_FLAGS)[number];

export function normalisePersonName(value: string) {
  return value.toUpperCase().split(/[^A-Z]+/).filter(Boolean).sort().join("");
}

/** A camera frame is ready for the auto shutter when imageQuality returned no warnings. */
export function frameReady(warnings: string[]) {
  return warnings.length === 0;
}

export function expiryFromMrz(yymmdd: string, todayYear: number) {
  if (!/^\d{6}$/.test(yymmdd)) return "";
  const yy = Number(yymmdd.slice(0, 2));
  const year = yy <= (todayYear % 100) + 30 ? 2000 + yy : 1900 + yy;
  const iso = `${year}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return "";
  return iso;
}

export function scanFlags(input: {
  confirmedName: string;
  readName: string;
  confirmedNumber: string;
  readNumber: string;
  expiry: string;
  today: string;
  checksum: "ok" | "failed" | "none";
  readFailed: boolean;
}): ScanFlag[] {
  const flags: ScanFlag[] = [];
  if (input.readFailed) flags.push("scan_unread");
  if (input.checksum === "failed") flags.push("scan_checksum");
  if (/^\d{4}-\d{2}-\d{2}$/.test(input.expiry) && /^\d{4}-\d{2}-\d{2}$/.test(input.today) && input.expiry < input.today) {
    flags.push("scan_expired");
  }
  const typedName = normalisePersonName(input.confirmedName);
  const readName = normalisePersonName(input.readName);
  const typedNumber = input.confirmedNumber;
  const readNumber = input.readNumber;
  if ((typedName && readName && typedName !== readName) || (typedNumber && readNumber && typedNumber !== readNumber)) {
    flags.push("scan_mismatch");
  }
  return SCAN_FLAGS.filter((flag) => flags.includes(flag));
}

export function joinScanFlags(flags: readonly string[]) {
  return SCAN_FLAGS.filter((flag) => flags.includes(flag)).join(",");
}

export function splitScanFlags(value: string): ScanFlag[] {
  return SCAN_FLAGS.filter((flag) => value.split(",").includes(flag));
}

export function scanFlagSentence(flag: string) {
  if (flag === "scan_unread") return "The words on the document could not be read on the device. A person still decides.";
  if (flag === "scan_checksum") return "A check digit on the machine-readable line did not add up. A person still decides.";
  if (flag === "scan_expired") return "The date on the document is in the past. A person still decides.";
  if (flag === "scan_mismatch") return "The text read on the device does not match what was typed. A person still decides.";
  return "";
}

export function scanFlagSentences(value: string) {
  return splitScanFlags(value).map((flag) => scanFlagSentence(flag)).filter(Boolean);
}
