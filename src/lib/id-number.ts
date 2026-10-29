import { createHmac } from "crypto";

/** The env var that holds the HMAC key. The value is never logged, printed, or committed. */
export const ID_NUMBER_KEY_ENV = "ID_NUMBER_HMAC_KEY";

/** Same rule as the database backfill in supabase/phase2a-verify.sql: upper case, no spaces, at most 40 characters. */
export function normaliseIdNumber(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "").slice(0, 40);
}

/** The last 3 characters, so a reviewer can match the document without the full number being stored. */
export function idNumberLast3(normalised: string) {
  return normalised.slice(-3);
}

/**
 * HMAC-SHA256 of the normalised number, as lower-case hex.
 * Matches encode(hmac(id_number, key, 'sha256'), 'hex') in Postgres pgcrypto.
 * Returns "" when the key is missing or too short, so callers refuse to store anything.
 */
export function hashIdNumber(normalised: string, key = process.env[ID_NUMBER_KEY_ENV] || "") {
  if (!normalised || key.length < 32) return "";
  return createHmac("sha256", key).update(normalised, "utf8").digest("hex");
}

/** Shown to reviewers and agents in place of the number. */
export function maskedIdNumber(last3: string) {
  return last3 ? `ends in ${last3}` : "";
}
