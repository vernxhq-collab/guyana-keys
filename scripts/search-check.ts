import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterListings, priceBoundsGyd } from "../src/lib/listing-search.ts";
import { cleanSite } from "../src/lib/site-facts.ts";
import type { Listing } from "../src/lib/data.ts";

function home(patch: Partial<Listing>): Listing {
  return {
    id: patch.id || "h",
    title: patch.title || "House",
    area: patch.area || "Kitty",
    region: patch.region || "Georgetown",
    type: patch.type || "House",
    purpose: patch.purpose || "Sale",
    priceGyd: patch.priceGyd ?? 20_000_000,
    beds: patch.beds ?? 3,
    baths: 1,
    sqft: 1000,
    lat: 6.8,
    lng: -58.16,
    pinned: true,
    image: "",
    description: "",
    agentId: "a",
    site: patch.site,
  };
}

const rows = [
  home({ id: "cheap", priceGyd: 10_000_000, beds: 2, area: "Kitty", purpose: "Rent", site: cleanSite({ generator: "yes", waterTank: "yes", parking: "yard" }) }),
  home({ id: "dear", priceGyd: 40_000_000, beds: 4, area: "Bel Air Park", purpose: "Sale", site: cleanSite({ generator: "no", waterTank: "no", parking: "none" }) }),
  home({ id: "land", type: "Land", beds: 0, area: "Providence", region: "East Bank Demerara", priceGyd: 8_000_000 }),
];

assert.equal(filterListings([], { beds: "2" }).shown.length, 0);
assert.deepEqual(filterListings(rows, { beds: "3" }).shown.map((item) => item.id), ["dear"]);
assert.deepEqual(filterListings(rows, { purpose: "Rent" }).shown.map((item) => item.id), ["cheap"]);
assert.deepEqual(filterListings(rows, { type: "Land" }).shown.map((item) => item.id), ["land"]);
assert.deepEqual(filterListings(rows, { area: "bel-air-park" }).shown.map((item) => item.id), ["dear"]);
assert.deepEqual(filterListings(rows, { region: "east-bank-demerara" }).shown.map((item) => item.id), ["land"]);
assert.deepEqual(filterListings(rows, { generator: "yes", waterTank: "yes", parking: "yard" }).shown.map((item) => item.id), ["cheap"]);
assert.equal(filterListings(rows, { generator: "yes" }).shown.some((item) => item.id === "land"), false);
assert.deepEqual(priceBoundsGyd({ min: "100000", currency: "usd" }), { currency: "usd", minGyd: 20_900_000, maxGyd: 0 });
assert.equal(filterListings(rows, { max: "15000", currency: "usd" }).shown.some((item) => item.id === "dear"), false);
assert.deepEqual(filterListings(rows, { budget: "12000000" }).shown.map((item) => item.id), ["cheap", "land"]);

const about = readFileSync(new URL("../src/app/about/page.tsx", import.meta.url), "utf8");
const contact = readFileSync(new URL("../src/app/contact/page.tsx", import.meta.url), "utf8");
const contactLib = readFileSync(new URL("../src/lib/contact.ts", import.meta.url), "utf8");
const apply = readFileSync(new URL("../src/app/agents/apply/page.tsx", import.meta.url), "utf8");
const advertise = readFileSync(new URL("../src/app/advertise/listing/page.tsx", import.meta.url), "utf8");
const sql = readFileSync(new URL("../supabase/listing-site-facts.sql", import.meta.url), "utf8");
assert.match(about, /Free to list, no limits/);
assert.equal(/founder|testimonial|WhatsApp|Messenger|Trinidad|Tobago|verified listings|trusted agents/i.test(about + contact), false);
assert.match(contactLib, /info@gykeys\.com/);
assert.equal(contactLib.includes("grokbot"), false);
assert.match(readFileSync(new URL("../src/lib/mail-from.ts", import.meta.url), "utf8"), /guyanakeys@mail\.grokbot\.com/);
assert.match(contactLib, /https:\/\/www\.facebook\.com\/GuyanaKeysGY/);
assert.match(contact, /publicEmail/);
assert.equal(contact.includes("grokbot"), false);
assert.match(contact, /facebookPage/);
assert.match(contact, /\/agents\/apply/);
assert.match(contact, /\/advertise/);
assert.match(apply, /Do not send an ID image/);
assert.match(advertise, /Payment is arranged with Guyana Keys before anything is featured or advertised\./);
assert.match(sql, /generator is null or generator in \('yes', 'no', 'unknown'\)/);
assert.match(readFileSync(new URL("../src/lib/agent-data.ts", import.meta.url), "utf8"), /"generator", "water_tank", "water_notes", "parking", "parking_spaces", "flood_risk", "furnished"/);
assert.match(readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8"), /\/about/);
assert.match(readFileSync(new URL("../src/app/list/page.tsx", import.meta.url), "utf8"), /redirect\("\/advertise"\)/);
assert.equal(cleanSite({ generator: "maybe", parkingSpaces: -1, floodRisk: "high" }).generator, "");
assert.equal(cleanSite({ floodRisk: "high" }).floodRisk, "high");

console.log("search checks passed");
