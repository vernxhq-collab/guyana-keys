import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { handoffOrigin, hostRedirects, redirectForDesk, siteOrigin } from "../src/lib/site-origin.ts";

assert.equal(siteOrigin(""), "https://gykeys.com");
assert.equal(siteOrigin("https://gykeys.com/"), "https://gykeys.com");
assert.equal(siteOrigin("https://www.gykeys.com"), "https://gykeys.com");
assert.equal(siteOrigin("https://guyana-keys.vercel.app"), "https://gykeys.com");
assert.equal(siteOrigin("https://guyana-keys-git-branch.vercel.app/admin"), "https://gykeys.com");
assert.equal(siteOrigin("http://localhost:3000"), "http://localhost:3000");
assert.equal(siteOrigin("not a url"), "https://gykeys.com");

assert.equal(redirectForDesk("buyer", ""), "https://gykeys.com/account");
assert.equal(redirectForDesk("agent", ""), "https://gykeys.com/agent");
assert.equal(redirectForDesk("admin", "https://guyana-keys.vercel.app"), "https://gykeys.com/admin");

const preview = hostRedirects("preview");
assert.equal(preview.some((rule) => rule.has.some((item) => item.value === "guyana-keys.vercel.app")), false);
assert.ok(preview.some((rule) => rule.has.some((item) => item.value === "www.gykeys.com")));

for (const env of ["production", ""]) {
  const rules = hostRedirects(env);
  for (const host of ["guyana-keys.vercel.app", "www.gykeys.com"]) {
    const rule = rules.find((item) => item.has.some((has) => has.value === host));
    assert.ok(rule, `${env || "local"} missing ${host}`);
    assert.equal(rule.source, "/:path*");
    assert.equal(rule.destination, "https://gykeys.com/:path*");
    assert.equal(rule.permanent, true);
    assert.equal(rule.destination.includes("vercel.app"), false);
  }
}

assert.equal(handoffOrigin("https://gykeys.com", "production"), "https://gykeys.com");
assert.equal(handoffOrigin("https://www.gykeys.com/scan", "production"), "https://gykeys.com");
assert.equal(handoffOrigin("https://guyana-keys.vercel.app", "production"), "https://gykeys.com");
assert.equal(handoffOrigin("https://guyana-keys-abc.vercel.app", "production"), "https://gykeys.com");
assert.equal(handoffOrigin("https://guyana-keys-git-x.vercel.app", "preview"), "https://guyana-keys-git-x.vercel.app");
assert.equal(handoffOrigin("http://localhost:3000", ""), "http://localhost:3000");

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesUnder(path);
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });
}

const src = new URL("../src/", import.meta.url);
const hits = filesUnder(src.pathname).filter((path) => readFileSync(path, "utf8").includes("guyana-keys.vercel.app"));
assert.deepEqual(hits.map((path) => path.slice(src.pathname.length)), ["lib/site-origin.ts"]);

console.log("site origin checks passed");
