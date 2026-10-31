// Phone scan checks. Synthetic data only: no real ID numbers, no real photos of a person.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { ID_CONSENT_VERSION, idConsentText } from "../src/lib/compliance/retention.ts";
import { imageQuality } from "../src/lib/keys-check.ts";
import { readMrz } from "../src/lib/mrz-read.ts";
import { claimAllowed, hashScanSecret, PHONE_SCAN_MINUTES, scanExpiry } from "../src/lib/phone-token.ts";
import { expiryFromMrz, frameReady, joinScanFlags, scanFlags, scanFlagSentence } from "../src/lib/scan-flags.ts";

const passport = [
  "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
  "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
].join("\n");
const read = readMrz(`${"noise"}\n${passport}`, 2026);
assert.equal(read.checksum, "ok");
assert.equal(read.number, "L898902C3");
assert.equal(read.expiry, "2012-04-15");
assert.match(read.name, /ERIKSSON/);
const broken = readMrz([
  "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
  "L898902C36UTO7408122F1204159ZE184226B<<<<<11",
].join("\n"), 2026);
assert.equal(broken.checksum, "failed");
assert.equal(readMrz("no machine readable line").checksum, "none");
assert.equal(expiryFromMrz("120415", 2026), "2012-04-15");
assert.equal(expiryFromMrz("nope", 2026), "");

const flags = scanFlags({
  confirmedName: "Sample Person",
  readName: "ERIKSSON ANNA MARIA",
  confirmedNumber: "SAMPLE01",
  readNumber: "L898902C3",
  expiry: "2012-04-15",
  today: "2026-10-31",
  checksum: "failed",
  readFailed: false,
});
assert.deepEqual(flags, ["scan_checksum", "scan_expired", "scan_mismatch"]);
assert.equal(joinScanFlags(flags), "scan_checksum,scan_expired,scan_mismatch");
assert.equal(scanFlags({
  confirmedName: "Anna Maria Eriksson",
  readName: "ERIKSSON ANNA MARIA",
  confirmedNumber: "L898902C3",
  readNumber: "L898902C3",
  expiry: "2030-01-01",
  today: "2026-10-31",
  checksum: "ok",
  readFailed: false,
}).length, 0);
assert.equal(scanFlagSentence("scan_expired").includes("person still decides"), true);
assert.equal(/\bverified\b|approve/i.test(scanFlagSentence("scan_mismatch")), false);
assert.equal(frameReady([]), true);
assert.equal(frameReady(["This photo looks soft."]), false);

const now = Date.parse("2026-10-31T00:00:00Z");
const expires = scanExpiry(now);
assert.equal(Date.parse(expires) - now, PHONE_SCAN_MINUTES * 60 * 1000);
assert.equal(PHONE_SCAN_MINUTES, 10);
assert.equal(claimAllowed({ usedAt: "", expiresAt: expires }, now + 1000), true);
assert.equal(claimAllowed({ usedAt: expires, expiresAt: expires }, now + 1000), false);
assert.equal(claimAllowed({ usedAt: "", expiresAt: expires }, now + 11 * 60 * 1000), false);
assert.equal(hashScanSecret("synthetic-token"), createHash("sha256").update("synthetic-token").digest("hex"));

const sharp = (await import("sharp")).default;
const { sniffType } = await import("../src/lib/upload-check.ts");
const flat = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#777" } }).jpeg().toBuffer();
assert.equal(sniffType(flat), "jpeg");
const sample = await sharp(flat).resize(32, 24).raw().toBuffer({ resolveWithObject: true });
const luminance: number[] = [];
for (let index = 0; index < sample.data.length; index += sample.info.channels) luminance.push(sample.data[index]);
const warnings = imageQuality({ width: 1200, height: 800, sampleWidth: sample.info.width, sampleHeight: sample.info.height, luminance });
assert.equal(warnings.some((line) => line.includes("soft")), true);
assert.equal(frameReady(warnings), false);

assert.equal(ID_CONSENT_VERSION, "2026-10-31-keys");
assert.match(idConsentText, /a photo of the one-time code on paper or on another screen/);
assert.match(idConsentText, /Guyana Keys looks after this information/);
assert.match(idConsentText, /Reading the words on the document happens on this device/);
assert.match(idConsentText, /no software compares faces/i);
assert.match(idConsentText, /You can withdraw consent at any time by emailing info@gykeys\.com/);
assert.equal(/\b(video|clip|verified)\b/i.test(idConsentText), false);

const sources = [
  "src/components/PhoneScan.tsx",
  "src/components/IdCamera.tsx",
  "src/app/scan/page.tsx",
  "src/app/preview/phone-scan/page.tsx",
  "src/lib/read-document.ts",
  "src/lib/scan-flags.ts",
].map((path) => readFileSync(path, "utf8")).join("\n");
assert.equal(/\bverified\b|whatsapp|sms|faceapi|compareFaces|jsdelivr/i.test(sources), false);
assert.equal(readFileSync("src/lib/read-document.ts", "utf8").includes("/tesseract/worker.min.js"), true);
assert.equal(JSON.parse(readFileSync("node_modules/mrz/package.json", "utf8")).license, "MIT");
assert.equal(JSON.parse(readFileSync("node_modules/qrcode/package.json", "utf8")).license, "MIT");
assert.equal(JSON.parse(readFileSync("node_modules/tesseract.js/package.json", "utf8")).license, "Apache-2.0");
assert.equal(JSON.parse(readFileSync("node_modules/tesseract.js-core/package.json", "utf8")).license, "Apache-2.0");
assert.match(readFileSync("public/tesseract/NOTICE.md", "utf8"), /Apache/);

console.log("phase3 checks passed");
