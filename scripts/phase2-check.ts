import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { draftDescription, draftReply } from "../src/lib/ai/local.ts";
import { DAILY_BRIEFING_ENABLED, dailyBriefingJob } from "../src/lib/ai/briefing.ts";
import { channelSenders } from "../src/lib/ai/channel.ts";
import { nextDraftStatus } from "../src/lib/ai/drafts.ts";
import { pendingEvent } from "../src/lib/ai/outbox.ts";
import { activeProvider } from "../src/lib/ai/provider.ts";
import { MIN_LIVE_PHOTOS } from "../src/lib/listing-rules.ts";
import { decodeWorld, encodeWorld } from "../src/lib/preview/codec.ts";
import { actors, buyerView, holdReply, matchesFor, performanceFor, saveDescription, seedWorld, todayFor, updateLead } from "../src/lib/preview/world.ts";
import { noticeAllowed, tooMany } from "../src/lib/abuse.ts";
import { checkBadge, expireStatus } from "../src/lib/licences.ts";
import { publishedRates, rateForLoan } from "../src/lib/rates.ts";
import { ID_CONSENT_VERSION, RETENTION_REVIEW_ENABLED, idConsentText, retentionReviewJob } from "../src/lib/compliance/retention.ts";
import { SUBJECT_TYPES, codeStillCurrent, imageQuality, makeCheckCode, verificationProvider } from "../src/lib/keys-check.ts";
import { guyanaInputValue, guyanaLabel, guyanaLocalToUtc } from "../src/lib/time.ts";

const world = seedWorld();
const matches = matchesFor(world, actors.asha);
assert.ok(matches.some((item) => item.home.includes("Bel Air")));
assert.equal(matches.some((item) => item.home.includes("New Amsterdam")), false);
assert.equal(matchesFor(world, actors.jon).some((item) => item.buyer === "Maria Singh"), false);
assert.ok(matchesFor(world, actors.ravi).some((item) => item.home.includes("Bel Air")));

const copy = draftDescription({ title: "Raised house, Bel Air Park", area: "Bel Air Park", purpose: "Sale", beds: 3, priceGyd: 95000000, notes: "Veranda and generator." });
assert.match(copy.description, /not proof of title/);
assert.match(copy.description, /Veranda/);
const reply = draftReply({ name: "Maria Singh", home: "Raised house, Bel Air Park", area: "Bel Air Park", note: "Thursday", abroad: true, viewingAt: null });
assert.match(reply.message, /Maria Singh/);
assert.equal(reply.provider, "local");

const held = holdReply(world, actors.asha, "lead-maria", reply.message);
assert.equal(held.error, undefined);
assert.equal(held.world.outbox.length, 2);
assert.ok(held.world.outbox.every((item) => item.status === "held"));
assert.equal(holdReply(world, actors.jon, "lead-maria", "no").error, "Not found or not in your agency.");
const drafted = updateLead(world, actors.asha, "lead-maria", { reply: "Thursday at 2pm works.", saveDraft: true });
assert.equal(buyerView(drafted.world, actors.maria).enquiries[0].reply, "");
const heldAfter = holdReply(drafted.world, actors.asha, "lead-maria", "Thursday at 2pm works.");
assert.equal(heldAfter.world.outbox.length, 2);
assert.equal(buyerView(heldAfter.world, actors.maria).enquiries[0].reply, "");
const utc = guyanaLocalToUtc("2026-10-23T15:00");
assert.equal(utc, "2026-10-23T19:00:00.000Z");
assert.equal(guyanaInputValue(utc || ""), "2026-10-23T15:00");
assert.equal(guyanaLocalToUtc("2026-10-23T19:00:00.000Z"), "2026-10-23T19:00:00.000Z");
assert.equal(guyanaLocalToUtc("2026-02-31T15:00"), null);
assert.match(guyanaLabel(utc || ""), /3:00/);
let packed = world;
for (let i = 0; i < 30; i += 1) {
  const next = holdReply(packed, actors.asha, "lead-maria", `Hold number ${i} stays on the desk.`, 1_700_000_000_000 + i);
  assert.equal(next.error, undefined);
  packed = next.world;
}
const cookie = encodeWorld(packed);
assert.ok(cookie.length <= 3800, `cookie is ${cookie.length}`);
const restored = decodeWorld(cookie);
assert.ok(restored.outbox.some((item) => item.body.includes("Hold number 29")));
let heavy = world;
const longReply = "A".repeat(400);
for (let i = 0; i < 40; i += 1) {
  const next = holdReply(heavy, actors.asha, "lead-maria", `${longReply} round ${i}`, 1_800_000_000_000 + i);
  assert.equal(next.error, undefined);
  const noted = updateLead(next.world, actors.asha, "lead-maria", { privateNote: "N".repeat(400), reply: longReply, saveDraft: true });
  heavy = noted.world;
}
const heavyCookie = encodeWorld(heavy);
assert.ok(heavyCookie.length <= 3800, `heavy cookie is ${heavyCookie.length}`);
const heavyRestored = decodeWorld(heavyCookie);
assert.ok(heavyRestored.outbox.length <= 4);
assert.ok(heavyRestored.leads.every((lead) => lead.privateNote.length <= 100));
assert.ok(heavyRestored.outbox.every((item) => item.body.length <= 140));
const stats = performanceFor(world, actors.asha);
assert.equal(stats.live, 2);
assert.equal(stats.hidden, 1);

const saved = saveDescription(world, actors.asha, "home-prov", copy.description);
assert.match(saved.world.listings.find((item) => item.id === "home-prov")?.description || "", /Bel Air/);
assert.equal(stats.rows.find((item) => item.id === "home-belair")?.views, 128);
assert.equal(stats.rows.find((item) => item.id === "home-belair")?.enquiries, 1);
assert.ok(todayFor(world, actors.asha).today.some((item) => item.text.includes("Maria")));

for (let i = 0; i < 20; i += 1) assert.equal(tooMany("slice-form", 20, 60_000), false);
assert.equal(tooMany("slice-form", 20, 60_000), true);
for (let i = 0; i < 20; i += 1) assert.equal(noticeAllowed("agent-slice"), true);
assert.equal(noticeAllowed("agent-slice"), false);

assert.equal(nextDraftStatus("draft", "send"), null);
assert.equal(nextDraftStatus("draft", "approve"), "approved");
assert.equal(nextDraftStatus("approved", "send"), "sent");
assert.equal(nextDraftStatus("approved", "approve"), null);
assert.equal(activeProvider().id, "noop");
assert.equal(DAILY_BRIEFING_ENABLED, false);
assert.deepEqual(dailyBriefingJob(), { ran: false, reason: "disabled" });
assert.equal(channelSenders.whatsapp.id, "whatsapp");
assert.deepEqual(pendingEvent("lead.created", { id: "x" }).status, "pending");
assert.equal(MIN_LIVE_PHOTOS, 3);
const listingRules = readFileSync(new URL("../src/lib/listing-rules.ts", import.meta.url), "utf8");
assert.equal(listingRules.includes("FREE_LIVE_CAP"), false);
assert.equal(listingRules.includes("withinLiveCap"), false);
const foundingSql = readFileSync(new URL("../supabase/founding.sql", import.meta.url), "utf8");
assert.equal(foundingSql.includes("cap reached"), false);
assert.match(readFileSync(new URL("../src/components/MarketHome.tsx", import.meta.url), "utf8"), /Free to list, no limits/);
assert.match(readFileSync(new URL("../src/app/agents/apply/page.tsx", import.meta.url), "utf8"), /Free to list, no limits/);
const homeSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const listingsSource = readFileSync(new URL("../src/app/listings/page.tsx", import.meta.url), "utf8");
const apiSource = readFileSync(new URL("../src/app/api/listings/route.ts", import.meta.url), "utf8");
const marketHome = readFileSync(new URL("../src/components/MarketHome.tsx", import.meta.url), "utf8");
const marketCard = readFileSync(new URL("../src/components/MarketCard.tsx", import.meta.url), "utf8");
assert.equal(homeSource.includes("lib/market-sample"), false);
assert.equal(marketHome.includes("lib/market-sample"), false);
assert.equal(marketCard.includes("lib/market-sample"), false);
assert.equal(listingsSource.includes("lib/market-sample"), false);
assert.equal(apiSource.includes("lib/market-sample"), false);
assert.equal(readFileSync(new URL("../src/lib/sample-label.ts", import.meta.url), "utf8").includes("Sample preview — not a real listing"), true);
assert.equal(readFileSync(new URL("../src/app/preview/home/page.tsx", import.meta.url), "utf8").includes("marketSample"), true);
assert.equal(readFileSync(new URL("../src/app/preview/home/page.tsx", import.meta.url), "utf8").includes("previewEnabled"), true);

const badge = checkBadge({
  idStatus: "checked",
  idCheckedAt: "2026-10-02T00:00:00Z",
  licences: [{ type: "gra_house_agent", status: "checked", checkedAt: "2026-10-02", expiry: "2027-01-01" }],
  today: "2026-10-22",
});
assert.equal(badge, "ID reviewed and GRA House Agent licence checked by Guyana Keys · Oct 2026");
assert.equal(badge.includes("Verified"), false);
assert.equal(checkBadge({
  idStatus: "checked",
  idCheckedAt: "2026-10-02T00:00:00Z",
  licences: [{ type: "gra_house_agent", status: "checked", checkedAt: "2026-10-02", expiry: "2026-10-01" }],
  today: "2026-10-22",
}), "ID reviewed by Guyana Keys · Oct 2026");
assert.equal(checkBadge({ licences: [], today: "2026-10-22" }), "");
assert.equal(expireStatus("rejected", "2020-01-01", "2026-10-22"), "rejected");
assert.equal(expireStatus("checked", "2026-10-01", "2026-10-22"), "expired");
const notifySource = readFileSync(new URL("../src/lib/notify.ts", import.meta.url), "utf8");
assert.match(notifySource, /🔑 Guyana Keys Lead/);
assert.match(notifySource, /Listing id:/);
assert.match(notifySource, /Page:/);
assert.match(notifySource, /Channel:/);
const enquiryStart = notifySource.indexOf("export async function notifyAgentEnquiry");
const enquiryNotice = notifySource.slice(enquiryStart, notifySource.indexOf("export async function notifyBuyer"));
assert.match(enquiryNotice, /channelSenders\.whatsapp\.send/);
assert.equal(enquiryNotice.includes("sendWhatsApp("), false);
assert.match(readFileSync(new URL("../src/lib/ai/channel.ts", import.meta.url), "utf8"), /whatsapp sender is not connected/);
assert.equal(RETENTION_REVIEW_ENABLED, false);
assert.deepEqual(retentionReviewJob(), { ran: false, reason: "disabled" });
assert.equal(publishedRates.some((rate) => /republic/i.test(rate.bank)), false);
const mortgageSource = readFileSync(new URL("../src/lib/mortgage.ts", import.meta.url), "utf8");
assert.match(mortgageSource, /return \{ stamp, legal, fees: stamp \+ legal \}/);
assert.equal(mortgageSource.includes("1.5"), false);
assert.equal(mortgageSource.includes("0.015"), false);
const partnersPage = readFileSync(new URL("../src/app/partners/page.tsx", import.meta.url), "utf8");
const calculator = readFileSync(new URL("../src/components/MortgageCalculator.tsx", import.meta.url), "utf8");
assert.equal(partnersPage.includes("partner-sample"), false);
assert.equal(calculator.includes("About 2%"), false);
assert.equal(calculator.includes("1.5%"), false);
assert.equal(calculator.includes("does not publish lender rates"), false);
assert.equal(calculator.includes("rateForLoan"), false);
assert.equal(calculator.includes("GBTI"), false);
assert.equal(calculator.includes("Demerara Bank"), false);
assert.equal(calculator.includes("Citizens Bank"), false);
assert.equal(calculator.includes("Scotiabank"), false);
assert.match(calculator, /Interest rate/);
const toolsPage = readFileSync(new URL("../src/app/tools/page.tsx", import.meta.url), "utf8");
assert.equal(toolsPage.includes("Still needing"), false);
assert.equal(rateForLoan(publishedRates, "GBTI", 4_000_000)?.id, "gbti-4m");
assert.equal(rateForLoan(publishedRates, "GBTI", 4_000_001)?.id, "gbti-9m");
assert.equal(rateForLoan(publishedRates, "GBTI", 9_000_000)?.id, "gbti-9m");
assert.equal(rateForLoan(publishedRates, "GBTI", 9_000_001)?.id, "gbti-20m");
assert.equal(rateForLoan(publishedRates, "GBTI", 20_000_001)?.id, "gbti-40m");
assert.equal(rateForLoan(publishedRates, "GBTI", 40_000_001)?.id, "gbti-60m");
assert.equal(rateForLoan(publishedRates, "GBTI", 60_000_000)?.id, "gbti-60m");
assert.equal(rateForLoan(publishedRates, "GBTI", 60_000_001), null);
assert.equal(rateForLoan(publishedRates, "Demerara Bank", 4_000_000)?.id, "demerara-4m");
assert.equal(rateForLoan(publishedRates, "Demerara Bank", 9_000_001)?.id, "demerara-15m");
assert.equal(rateForLoan(publishedRates, "Demerara Bank", 15_000_001)?.id, "demerara-40m");
assert.equal(rateForLoan(publishedRates, "Demerara Bank", 40_000_001)?.id, "demerara-above");
assert.equal(rateForLoan(publishedRates, "Demerara Bank", 80_000_000)?.rate, 8);
assert.equal(rateForLoan(publishedRates, "Citizens Bank", 10_000_000)?.id, "citizens-10m");
assert.equal(rateForLoan(publishedRates, "Citizens Bank", 10_000_001)?.id, "citizens-20m");
assert.equal(rateForLoan(publishedRates, "Citizens Bank", 30_000_001)?.id, "citizens-50m");
assert.equal(rateForLoan(publishedRates, "Citizens Bank", 50_000_001), null);
assert.equal(rateForLoan(publishedRates, "Scotiabank Guyana", 1)?.id, "scotia-floor");
assert.equal(rateForLoan(publishedRates, "Scotiabank Guyana", 90_000_000)?.rate, 4);
assert.equal(rateForLoan(publishedRates, "Republic Bank", 1_000_000), null);
const keysPreview = readFileSync(new URL("../src/app/preview/keys-check/page.tsx", import.meta.url), "utf8");
assert.match(keysPreview, />Sample preview</);
assert.equal(keysPreview.includes("not a real listing"), false);
const verificationDoc = readFileSync(new URL("../docs/strategy-2026-10/verification.md", import.meta.url), "utf8");
const inventoryDoc = readFileSync(new URL("../docs/strategy-2026-10/inventory.md", import.meta.url), "utf8");
assert.equal(verificationDoc.includes("no private bucket"), false);
assert.equal(verificationDoc.includes("Do not store an ID image"), false);
assert.equal(inventoryDoc.includes("Do not store ID images"), false);
assert.match(verificationDoc, /identity-documents/);
assert.match(inventoryDoc, /identity-documents/);
assert.equal(readFileSync(new URL("../src/app/agents/[id]/page.tsx", import.meta.url), "utf8").includes("Verified on Guyana Keys"), false);
assert.equal(readFileSync(new URL("../src/app/preview/partners/page.tsx", import.meta.url), "utf8").includes("previewEnabled"), true);
assert.equal(readFileSync(new URL("../src/app/preview/partners/page.tsx", import.meta.url), "utf8").includes("partnerSample"), true);
assert.equal(verificationProvider().id, "manual");
assert.equal(verificationProvider().review, "human");
assert.equal(verificationProvider().subjectType, "agent");
assert.equal(verificationProvider("tenant").id, "manual");
assert.equal(verificationProvider("tenant").subjectType, "tenant");
assert.deepEqual([...SUBJECT_TYPES], ["agent", "tenant", "purchaser", "landlord"]);
assert.equal(makeCheckCode(() => 0), "AAAAAA");
assert.equal(codeStillCurrent(new Date().toISOString()), true);
assert.equal(codeStillCurrent("2020-01-01T00:00:00Z"), false);
assert.equal(ID_CONSENT_VERSION, "2026-10-31-keys");
assert.match(idConsentText, /a photo of the one-time code on paper or on another screen/);
assert.equal(/\b(video|clip)\b/i.test(idConsentText), false);
assert.equal(/\bverified\b/i.test(idConsentText), false);
assert.match(idConsentText, /You can withdraw consent at any time by emailing info@gykeys\.com\. If you do, the check stops and your images are deleted under the retention rules\./);
const tiny = imageQuality({ width: 40, height: 40, sampleWidth: 4, sampleHeight: 4, luminance: Array.from({ length: 16 }, () => 255) });
assert.equal(tiny.some((line) => line.includes("small")), true);
assert.equal(tiny.some((line) => line.includes("bright")), true);
const sharp = imageQuality({
  width: 1200,
  height: 800,
  sampleWidth: 8,
  sampleHeight: 8,
  luminance: Array.from({ length: 64 }, (_, index) => (index % 2 ? 20 : 180)),
});
assert.equal(sharp.length, 0);
const keysUi = readFileSync(new URL("../src/components/KeysCapture.tsx", import.meta.url), "utf8")
  + readFileSync(new URL("../src/app/admin/(desk)/keys-check/page.tsx", import.meta.url), "utf8");
assert.equal(/didit|certified|face recognition|accuracy/i.test(keysUi), false);
assert.equal(readFileSync(new URL("../src/app/preview/keys-check/page.tsx", import.meta.url), "utf8").includes("previewEnabled"), true);

console.log("phase 2 checks passed");
