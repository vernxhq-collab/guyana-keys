import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { draftDescription, draftReply } from "../src/lib/ai/local.ts";
import { DAILY_BRIEFING_ENABLED, dailyBriefingJob } from "../src/lib/ai/briefing.ts";
import { channelSenders } from "../src/lib/ai/channel.ts";
import { nextDraftStatus } from "../src/lib/ai/drafts.ts";
import { pendingEvent } from "../src/lib/ai/outbox.ts";
import { activeProvider } from "../src/lib/ai/provider.ts";
import { FREE_LIVE_CAP, liveCap, MIN_LIVE_PHOTOS, withinLiveCap } from "../src/lib/listing-rules.ts";
import { decodeWorld, encodeWorld } from "../src/lib/preview/codec.ts";
import { actors, buyerView, holdReply, matchesFor, performanceFor, saveDescription, seedWorld, todayFor, updateLead } from "../src/lib/preview/world.ts";
import { noticeAllowed, tooMany } from "../src/lib/abuse.ts";
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
assert.equal(FREE_LIVE_CAP, 3);
assert.equal(MIN_LIVE_PHOTOS, 3);
assert.equal(withinLiveCap(2, 3), true);
assert.equal(withinLiveCap(3, 3), false);
assert.equal(liveCap("starter", 10), 3);
assert.equal(liveCap("agency", 10), 10);
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

console.log("phase 2 checks passed");
