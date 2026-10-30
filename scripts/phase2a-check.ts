// Phase 2a checks. Synthetic data only: no real ID numbers, no real files.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { hashIdNumber, idNumberLast3, ID_NUMBER_KEY_ENV, maskedIdNumber, normaliseIdNumber } from "../src/lib/id-number.ts";
import { declaredMatches, pdfLooksActive, sniffType, UPLOAD_MAX_BYTES } from "../src/lib/upload-check.ts";
import { reviewBadgeText, reviewMonth } from "../src/lib/review-badge.ts";
import { checkBadge } from "../src/lib/licences.ts";
import { tokenAal, cleanCode } from "../src/lib/mfa-token.ts";

// A throwaway test key. Not used anywhere else.
const KEY = "synthetic-test-key-0123456789abcdef-not-real";

// Hashed ID number
assert.equal(ID_NUMBER_KEY_ENV, "ID_NUMBER_HMAC_KEY");
assert.equal(normaliseIdNumber("  ab 12 c\t34x "), "AB12C34X");
assert.equal(normaliseIdNumber("x".repeat(60)).length, 40);
assert.equal(idNumberLast3("AB12C34X"), "34X");
assert.equal(maskedIdNumber("34X"), "ends in 34X");
assert.equal(maskedIdNumber(""), "");
const hashed = hashIdNumber("TEST0001", KEY);
assert.match(hashed, /^[0-9a-f]{64}$/);
assert.equal(hashed, createHmac("sha256", KEY).update("TEST0001").digest("hex"));
assert.equal(hashIdNumber("TEST0001", KEY), hashIdNumber(normaliseIdNumber(" test 0001 "), KEY));
assert.notEqual(hashIdNumber("TEST0001", KEY), hashIdNumber("TEST0002", KEY));
assert.notEqual(hashIdNumber("TEST0001", KEY), hashIdNumber("TEST0001", `${KEY}-other`));
assert.equal(hashIdNumber("TEST0001", "short"), "", "a short key must refuse");
assert.equal(hashIdNumber("TEST0001", ""), "", "a missing key must refuse");
assert.equal(hashIdNumber("", KEY), "");
// RFC 4231 test case 2, so the Node HMAC matches pgcrypto's hmac(..., 'sha256').
assert.equal(createHmac("sha256", "Jefe").update("what do ya want for nothing?").digest("hex"), "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");

// Magic bytes
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const pdf = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n");
const html = Buffer.from("<html><script>alert(1)</script>");
assert.equal(sniffType(jpeg), "jpeg");
assert.equal(sniffType(png), "png");
assert.equal(sniffType(pdf), "pdf");
assert.equal(sniffType(html), "");
assert.equal(sniffType(Buffer.from("RIFF\0\0\0\0WEBPVP8 ")), "webp");
assert.equal(sniffType(Buffer.from("\0\0\0\x18ftypheic\0\0")), "heic");
assert.equal(declaredMatches("image/jpeg", "jpeg"), true);
assert.equal(declaredMatches("image/jpeg", "png"), false, "a renamed file is refused");
assert.equal(declaredMatches("image/png", "jpeg"), false);
assert.equal(declaredMatches("application/pdf", "pdf"), true);
assert.equal(declaredMatches("text/html", ""), false);
assert.equal(declaredMatches("image/webp", "webp"), false, "only JPEG, PNG, PDF are accepted");
assert.equal(pdfLooksActive(pdf), false);
assert.equal(pdfLooksActive(Buffer.from("%PDF-1.7 << /OpenAction 5 0 R >>")), true);
assert.equal(pdfLooksActive(Buffer.from("%PDF-1.7 << /S /JavaScript /JS (app.alert(1)) >>")), true);
assert.equal(pdfLooksActive(Buffer.from("%PDF-1.7 << /Type /EmbeddedFile >>")), true);
assert.equal(UPLOAD_MAX_BYTES, 10_000_000);

// Re-encode strips metadata and caps size (sharp, synthetic image).
const sharp = (await import("sharp")).default;
const { reencodeImage } = await import("../src/lib/upload-check.ts");
const big = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: "#336699" } })
  .withMetadata({ exif: { IFD0: { Copyright: "synthetic-marker" } } })
  .jpeg()
  .toBuffer();
assert.ok(big.includes(Buffer.from("synthetic-marker")), "fixture has metadata");
const clean = await reencodeImage(big);
const meta = await sharp(clean).metadata();
assert.equal(meta.format, "jpeg");
assert.equal(meta.width, 2000);
assert.equal(meta.exif, undefined, "EXIF is dropped");
assert.equal(clean.includes(Buffer.from("synthetic-marker")), false);
const fromPng = await reencodeImage(await sharp({ create: { width: 40, height: 30, channels: 4, background: "#fff" } }).png().toBuffer());
assert.equal(sniffType(fromPng), "jpeg");
await assert.rejects(reencodeImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])), "a broken image is refused");

// Badge
assert.equal(reviewMonth("2026-10-29T12:00:00Z"), "Oct 2026");
assert.equal(reviewBadgeText({ kind: "id", status: "approved", reviewedAt: "2026-10-29T12:00:00Z" }), "ID reviewed by Guyana Keys · Oct 2026");
assert.equal(reviewBadgeText({ kind: "id", status: "checked", reviewedAt: "2026-03-02T00:00:00Z", subjectType: "landlord" }), "ID reviewed by Guyana Keys · Mar 2026");
assert.equal(reviewBadgeText({ kind: "id", status: "pending", reviewedAt: "2026-10-29T12:00:00Z" }), "");
assert.equal(reviewBadgeText({ kind: "id", status: "approved", reviewedAt: "" }), "");
assert.equal(reviewBadgeText({ kind: "id", status: "approved", reviewedAt: "2026-10-29", subjectType: "nobody" as never }), "");
assert.equal(checkBadge({ idStatus: "checked", idCheckedAt: "2026-10-29T12:00:00Z", licences: [], today: "2026-10-30" }), "ID reviewed by Guyana Keys · Oct 2026");
assert.equal(checkBadge({ idStatus: "pending", idCheckedAt: "2026-10-29T12:00:00Z", licences: [], today: "2026-10-30" }), "");

// Two-step sign-in token reading (claims are only read after Supabase accepted the token).
const jwt = (payload: object) => `x.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.y`;
assert.equal(tokenAal(jwt({ aal: "aal2" })), "aal2");
assert.equal(tokenAal(jwt({ aal: "aal1" })), "aal1");
assert.equal(tokenAal(jwt({})), "");
assert.equal(tokenAal("not-a-token"), "");
assert.equal(cleanCode(" 123 456 "), "123456");
assert.equal(cleanCode("12345"), "");
assert.equal(cleanCode("abcdef"), "");

// No public text says "verified" in the new Phase 2a files.
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
const phase2a = [
  "src/components/ReviewBadge.tsx",
  "src/components/TwoStep.tsx",
  "src/components/KeysCapture.tsx",
  "src/lib/review-badge.ts",
  "src/app/preview/keys-check/page.tsx",
  ...files("src/app/api/agent/identity"),
];
for (const path of phase2a) {
  const source = readFileSync(path, "utf8");
  assert.equal(/\bverified\b/i.test(source.replace(/status\s*[!=]==\s*"verified"/g, "")), false, `${path} must not say verified`);
}
assert.equal(/clip|video/i.test(readFileSync("src/components/KeysCapture.tsx", "utf8")), false, "the clip option is gone");
// The plain ID number is no longer written by the app.
const data = readFileSync("src/lib/keys-check-data.ts", "utf8");
assert.equal(/\bid_number\s*:/.test(data), false, "the app must not write id_number");
assert.match(data, /id_number_hmac:/);
// The upload no longer carries the file through the server function.
assert.equal(/formData\(\)/.test(readFileSync("src/app/api/agent/identity/route.ts", "utf8")), false);

console.log("phase2a checks passed");
