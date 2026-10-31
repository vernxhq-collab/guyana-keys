import { parse } from "mrz";
import { expiryFromMrz, normalisePersonName } from "./scan-flags.ts";

export type MrzRead = {
  name: string;
  number: string;
  expiry: string;
  checksum: "ok" | "failed" | "none";
};

const EMPTY: MrzRead = { name: "", number: "", expiry: "", checksum: "none" };

function mrzLines(text: string) {
  return text
    .toUpperCase()
    .split(/\r?\n/)
    .map((line) => line.replace(/[^A-Z0-9<]/g, ""))
    .filter((line) => line.length >= 28 && line.includes("<"));
}

/**
 * Reads a passport machine-readable zone from text already recognised on the device.
 * Check digits are the only "failed" result. An unknown country code is not a failure.
 * Returns nothing structured when the lines are not a passport zone.
 */
export function readMrz(text: string, todayYear = new Date().getUTCFullYear()): MrzRead {
  const lines = mrzLines(text);
  if (lines.length < 2) return EMPTY;
  const candidates = lines.length >= 3 ? [lines.slice(-2), lines.slice(-3)] : [lines.slice(-2)];
  for (const group of candidates) {
    try {
      const result = parse(group);
      const digits = result.details.filter((detail) => detail.field?.endsWith("CheckDigit"));
      if (!digits.length || !result.fields.documentNumber) continue;
      const name = [result.fields.lastName, result.fields.firstName].filter(Boolean).join(" ");
      return {
        name: normalisePersonName(name) ? name : "",
        number: String(result.fields.documentNumber || "").replace(/</g, ""),
        expiry: expiryFromMrz(String(result.fields.expirationDate || ""), todayYear),
        checksum: digits.every((detail) => detail.valid) ? "ok" : "failed",
      };
    } catch {
      // The next group of lines may be the zone.
    }
  }
  return EMPTY;
}
