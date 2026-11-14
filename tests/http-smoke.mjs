// Run against an already started dev or production server: node tests/http-smoke.mjs [base-url]
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const base = process.argv[2] ?? "http://127.0.0.1:3001";
const report = JSON.parse(
  await readFile(new URL("../public/data/analysis.json", import.meta.url), "utf8"),
);
const pages = [
  ["/", "Every wetland"],
  ["/explore", "A changing landscape."],
  ["/insights", "What the signal says."],
  ["/about", "Follow the evidence."],
];
for (const [path, text] of pages) {
  const response = await fetch(base + path, { redirect: "error" });
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(html.includes(text), `${path} should include its page heading`);
  assert.ok(html.includes("Radar backscatter change is NOT validated flood extent."));
  assert.ok(!html.includes("Create Next App"));
  assert.ok(
    html.includes('aria-label="Choose color theme"'),
    "Every page must expose the theme picker",
  );
  assert.ok(
    html.includes('id="earthpulse-theme-init"'),
    "Stored preferences must apply before paint",
  );
  for (const name of [
    "Haor Ivory",
    "Midnight Orbit",
    "Aurora Grove",
    "Solar Dusk",
    "Glacier",
    "Nebula",
  ]) {
    assert.ok(html.includes(name), `${path} should offer the ${name} theme`);
  }
  for (const route of ["/explore", "/insights", "/about"]) {
    assert.ok(html.includes(`href="${route}"`), `Navigation to ${route} must exist on ${path}`);
  }
  if (path === "/explore")
    assert.ok(!html.includes("leaflet-container"), "Leaflet must remain client-only");
  if (path === "/insights") {
    assert.ok(
      html.includes(new Intl.NumberFormat("en-US").format(report.quality.pairedValidPixels)),
    );
    assert.ok(
      html.includes(report.delta.meanDb.toFixed(2)),
      "Displayed mean must match generated analysis",
    );
  }
  console.log(`${path}: HTTP 200, heading, navigation and scientific notice verified`);
}
const home = await (await fetch(base + "/")).text();
const stylesheetPaths = [
  ...new Set([...home.matchAll(/href="([^"]+\.css(?:\?[^"]*)?)"/g)].map((match) => match[1])),
];
assert.ok(stylesheetPaths.length > 0, "The app must load compiled stylesheets");
let styles = "";
for (const path of stylesheetPaths) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
  assert.ok(response.headers.get("content-type")?.includes("text/css"));
  styles += await response.text();
}
for (const selector of [".site-navigation", ".radar-leaflet-map", ".data-table"]) {
  assert.ok(styles.includes(selector), `Compiled styles must include ${selector}`);
}
console.log("Shared, explorer and table stylesheets delivered successfully.");

for (const asset of Object.values(report.assets)) {
  const response = await fetch(base + asset.url);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("content-type")?.includes("image/webp"));
  assert.ok(response.headers.get("cache-control")?.includes("immutable"));
  const actual = Buffer.from(await response.arrayBuffer());
  const expected = await readFile(new URL("../public" + asset.url, import.meta.url));
  assert.equal(actual.length, asset.bytes);
  assert.ok(actual.equals(expected));
  assert.ok(asset.url.includes(createHash("sha256").update(actual).digest("hex").slice(0, 12)));
  console.log(
    `${asset.url}: ${actual.length} bytes, exact file, content hash and immutable cache verified`,
  );
}
for (const path of [
  "/data/metadata.json",
  "/data/analysis.json",
  "/data/study-area.geojson",
  "/data/discovery.json",
  "/data/reference-probe.json",
]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200);
  await response.json();
}
assert.equal((await fetch(base + "/data/display/missing.webp")).status, 404);
assert.equal((await fetch(base + "/route-that-does-not-exist")).status, 404);
console.log(
  "JSON assets and missing-resource 404 handling verified. This is HTTP testing, not browser interaction testing.",
);
