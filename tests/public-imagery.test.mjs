import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadTypeScript } from "./support/load-typescript.mjs";
const { observationRegistry, displayedObservation, comparisonRegistry } = await loadTypeScript(
  new URL("../src/data/observations.ts", import.meta.url),
);
const imagery = JSON.parse(
  await readFile(new URL("../public/data/public-imagery.json", import.meta.url), "utf8"),
);
test("all public optical observations are downloaded local images with their own source identity", async () => {
  assert.ok(imagery.observations.length >= 10);
  for (const image of imagery.observations) {
    const bytes = await readFile(new URL("../public" + image.asset.url, import.meta.url));
    assert.equal(bytes.length, image.asset.bytes);
    const obs = observationRegistry.find((o) => o.id === image.id);
    assert.equal(obs.kind, "optical-browse");
    assert.match(obs.mission, /MODIS/);
    assert.equal(obs.coveragePercent, null);
  }
});
test("catalog fallback uses a distinct same-date optical record without promoting the catalog product", () => {
  const candidate = observationRegistry.find((o) => o.contextObservationId);
  assert.equal(candidate.status, "catalog-only");
  assert.equal(candidate.asset, null);
  const display = displayedObservation(candidate.id);
  assert.notEqual(display.id, candidate.id);
  assert.equal(display.date, candidate.date);
  assert.equal(display.kind, "optical-browse");
});
test("optical comparisons are explicitly visual and never mixed radar calculations", () => {
  for (const comparison of comparisonRegistry.filter((c) => c.type === "imagery")) {
    assert.equal(displayedObservation(comparison.observationA).kind, "optical-browse");
    assert.equal(displayedObservation(comparison.observationB).kind, "optical-browse");
    assert.match(comparison.method, /no pixel subtraction/);
  }
});
