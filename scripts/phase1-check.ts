import assert from "node:assert/strict";
import { actors, buyerView, leadFor, seedWorld, todayFor, updateLead } from "../src/lib/preview/world.ts";

const world = seedWorld(Date.parse("2026-10-21T12:00:00Z"));
const asha = actors.asha;
const jon = actors.jon;
const maria = actors.maria;

const ashaToday = todayFor(world, asha, Date.parse("2026-10-21T15:00:00Z"));
assert.equal(ashaToday.unanswered, 1);
assert.ok(ashaToday.today.some((item) => item.text.includes("Maria")));
assert.equal(ashaToday.audits.some((item) => item.detail.includes("Kevin")), false);

const jonToday = todayFor(world, jon, Date.parse("2026-10-21T15:00:00Z"));
assert.ok(jonToday.today.some((item) => item.text.includes("Kevin")));
assert.equal(jonToday.today.some((item) => item.text.includes("Maria")), false);
assert.equal(leadFor(world, jon, "lead-maria").error, "That lead belongs to another agency.");

const saved = updateLead(world, asha, "lead-maria", { reply: "Thursday at 2pm works." }, Date.parse("2026-10-21T16:00:00Z"));
assert.equal(saved.error, undefined);
const viewed = updateLead(saved.world, asha, "lead-maria", { viewingAt: "2026-10-23T18:00:00Z" }, Date.parse("2026-10-21T16:05:00Z"));
const buyer = buyerView(viewed.world, maria);
assert.equal(buyer.enquiries.length, 1);
assert.match(buyer.enquiries[0].reply, /Thursday at 2pm/);
assert.ok(buyer.enquiries[0].viewingAt);
assert.equal(buyerView(viewed.world, maria).enquiries.some((item) => item.home.includes("New Amsterdam")), false);
assert.ok(viewed.world.audits.some((item) => item.action === "lead" && item.detail.includes("Viewing set")));
assert.equal(leadFor(viewed.world, asha, "lead-kevin").error, "That lead belongs to another agency.");

console.log("phase 1 checks passed");
