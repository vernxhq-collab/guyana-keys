import assert from "node:assert/strict";
import { draftDescription, draftReply } from "../src/lib/ai/local.ts";
import { actors, holdReply, matchesFor, performanceFor, saveDescription, seedWorld, todayFor } from "../src/lib/preview/world.ts";

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
assert.equal(holdReply(world, actors.jon, "lead-maria", "no").error, "That lead belongs to another agency.");

const saved = saveDescription(world, actors.asha, "home-prov", copy.description);
assert.match(saved.world.listings.find((item) => item.id === "home-prov")?.description || "", /Bel Air/);
const stats = performanceFor(world, actors.asha);
assert.equal(stats.rows.find((item) => item.id === "home-belair")?.views, 128);
assert.equal(stats.rows.find((item) => item.id === "home-belair")?.enquiries, 1);
assert.ok(todayFor(world, actors.asha).today.some((item) => item.text.includes("Maria")));

console.log("phase 2 checks passed");
