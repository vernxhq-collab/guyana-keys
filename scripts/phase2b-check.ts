// Phase 2b checks. Synthetic data only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkBadge } from "../src/lib/licences.ts";
import {
  canOpenReviewDesk,
  evidenceRefError,
  itemIsPriority,
  levelNotice,
  LEVEL_STATUS_EMAILS_ENABLED,
  outcomeFrom,
  sortReviewItems,
  sendLevelNotice,
  SUPPORT_EMAIL,
} from "../src/lib/levels.ts";

assert.equal(checkBadge({
  level: "identity_reviewed",
  state: "active",
  badgeMonth: "Oct 2026",
  licences: [],
  today: "2026-10-31",
}), "ID reviewed by Guyana Keys · Oct 2026");
assert.equal(checkBadge({
  level: "licensed_agent",
  state: "active",
  badgeMonth: "Oct 2026",
  licences: [],
  today: "2026-10-31",
}), "Licence checked by Guyana Keys · Oct 2026");
assert.equal(checkBadge({
  level: "registered",
  state: "active",
  badgeMonth: "Oct 2026",
  licences: [],
  today: "2026-10-31",
}), "");
assert.equal(checkBadge({
  level: "identity_reviewed",
  state: "revoked",
  badgeMonth: "Oct 2026",
  licences: [],
  today: "2026-10-31",
}), "");
assert.equal(checkBadge({
  level: "licensed_agent",
  state: "expired",
  badgeMonth: "Oct 2026",
  licences: [],
  today: "2026-10-31",
}), "");
assert.equal(checkBadge({
  idStatus: "checked",
  idCheckedAt: "2026-10-02T00:00:00Z",
  licences: [{ type: "gra_house_agent", status: "checked", checkedAt: "2026-10-02", expiry: "2027-01-01" }],
  today: "2026-10-22",
}), "ID reviewed and GRA House Agent licence checked by Guyana Keys · Oct 2026");

const queued = sortReviewItems([
  { id: "plain", priority: itemIsPriority([]), at: "2026-10-30T00:00:00Z" },
  { id: "mismatch", priority: itemIsPriority(["The text read on the device does not match what was typed."]), at: "2026-10-01T00:00:00Z" },
  { id: "duplicate", priority: itemIsPriority(["This file matches a file already stored on another account."]), at: "2026-10-15T00:00:00Z" },
]);
assert.deepEqual(queued.map((row) => row.id), ["duplicate", "mismatch", "plain"]);
assert.equal(itemIsPriority(["scan_mismatch"]), true);

assert.equal(canOpenReviewDesk({ emailOnList: true, aal2: true, role: "reviewer" }), true);
assert.equal(canOpenReviewDesk({ emailOnList: true, aal2: false, role: "senior_reviewer" }), false);
assert.equal(canOpenReviewDesk({ emailOnList: false, aal2: true, role: "admin" }), false);
assert.equal(canOpenReviewDesk({ emailOnList: true, aal2: true, role: "" }), false);
assert.equal(canOpenReviewDesk({ emailOnList: true, aal2: true, role: "agent" }), false);

assert.equal(evidenceRefError("uploaded image"), "An uploaded licence image on its own does not complete this check.");
assert.equal(evidenceRefError("short"), "Write how the licence was confirmed, including a reference.");
assert.equal(evidenceRefError("GRA Licence Revenue Office confirmed by email, ref 1001"), "");
assert.match(evidenceRefError("see the uploaded file please"), /uploaded licence image|office or message/);

const reviewed = outcomeFrom({ level: "identity_reviewed", state: "active", badgeMonth: "Oct 2026" });
assert.equal(reviewed.title, "ID reviewed");
assert.match(reviewed.body, /ID reviewed by Guyana Keys · Oct 2026/);
assert.match(reviewed.body, /Thank you\.$/);
const paused = outcomeFrom({ state: "revoked", latestReason: "The code on the paper did not match.", decisionId: "d1" });
assert.equal(paused.title, "Not approved or paused");
assert.equal(paused.appealDecisionId, "d1");
assert.match(paused.body, /Appeal/);
const support = outcomeFrom({ level: "registered", state: "active" });
assert.equal(support.screen, "none");
assert.equal(outcomeFrom({ latestAction: "request_info", latestReason: "The photo was too dark.", keysStatus: "collecting" }).title, "More information needed");
assert.equal(outcomeFrom({ level: "identity_reviewed", state: "active", licencePending: true, badgeMonth: "Oct 2026" }).title, "Licence check");

assert.equal(LEVEL_STATUS_EMAILS_ENABLED, false);
for (const kind of ["received", "more_info", "id_reviewed", "licence_checked", "not_approved", "appeal_received", "appeal_decided"] as const) {
  const message = levelNotice(kind, { reason: "The photo was too dark.", badge: "ID reviewed by Guyana Keys · Oct 2026" });
  assert.match(message.text, /Thank you\.$/);
  assert.equal(/\bverified\b/i.test(`${message.subject}\n${message.text}`), false, kind);
  assert.equal(/whatsapp|trinidad|tobago|trini keys/i.test(`${message.subject}\n${message.text}`), false, kind);
}
assert.equal(SUPPORT_EMAIL, "info@gykeys.com");
const unsent = await sendLevelNotice({ kind: "id_reviewed", to: "agent@example.com", badge: "ID reviewed by Guyana Keys · Oct 2026" });
assert.equal(unsent.sent, false);
assert.equal(unsent.reason, "disabled");

const levelsSql = readFileSync("supabase/phase2b-levels.sql", "utf8");
const checkSql = readFileSync("supabase/phase2b-levels-check.sql", "utf8");
assert.match(levelsSql, /vf_expire_due/);
assert.match(levelsSql, /public_agent_badges/);
assert.match(levelsSql, /verification_decisions is append-only/);
assert.equal(/stripe|twilio/i.test(levelsSql), false);
const checkBody = checkSql.replace(/--.*$/gm, "").replace(/'[^']*'/g, "''");
assert.equal(/\b(insert|update|delete|truncate|drop|alter|create)\b/i.test(checkBody), false);
assert.match(readFileSync("src/lib/keys-check-data.ts", "utf8"), /createSignedUrl\(text\(row\.data\?\.storage_path\), 60\)/);
assert.match(readFileSync("src/app/agent/(desk)/checks/page.tsx", "utf8"), /PhoneScan/);
assert.match(readFileSync("src/app/agents/apply/page.tsx", "utf8"), /Do not send an ID image\. A person reviews the application before any listing is public\./);
assert.match(readFileSync("src/app/advertise/listing/page.tsx", "utf8"), /Payment is arranged with Guyana Keys before anything is featured or advertised\./);

const copyFiles = [
  "src/components/ReviewDesk.tsx",
  "src/components/CheckOutcome.tsx",
  "src/lib/levels.ts",
  "src/lib/level-sample.ts",
  "src/app/preview/levels/page.tsx",
  "src/app/admin/(desk)/keys-check/page.tsx",
];
for (const path of copyFiles) {
  const source = readFileSync(path, "utf8");
  assert.equal(/\bverified\b/i.test(source), false, path);
  assert.equal(/trusted agents|verified listings|trinidad|tobago|trini keys|whatsapp/i.test(source), false, path);
}

console.log("phase 2b checks passed");
