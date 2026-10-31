import { createHash, randomBytes } from "crypto";

/** How long a desktop-to-phone link works. Single use. */
export const PHONE_SCAN_MINUTES = 10;
export const PHONE_SCAN_COOKIE = "gk_phone_scan";

export function hashScanSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function newScanSecret() {
  return randomBytes(32).toString("base64url");
}

export function scanExpiry(now = Date.now()) {
  return new Date(now + PHONE_SCAN_MINUTES * 60 * 1000).toISOString();
}

/** A link can be claimed once, and only before it expires. */
export function claimAllowed(row: { usedAt: string; expiresAt: string }, now = Date.now()) {
  if (row.usedAt) return false;
  const expires = new Date(row.expiresAt).getTime();
  return Number.isFinite(expires) && expires > now;
}

export function remainingSeconds(expiresAt: string, now = Date.now()) {
  const expires = new Date(expiresAt).getTime();
  if (!Number.isFinite(expires)) return 0;
  return Math.max(0, Math.floor((expires - now) / 1000));
}
