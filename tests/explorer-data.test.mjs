import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./support/load-typescript.mjs";
const { observationRegistry, comparisonRegistry, originalRadarPair } = await loadTypeScript(
  new URL("../src/data/observations.ts", import.meta.url),
);
const { checkComparison } = await loadTypeScript(
  new URL("../src/lib/comparison.ts", import.meta.url),
);
const { seasonal, radarCategories } = await loadTypeScript(
  new URL("../src/data/seasons.ts", import.meta.url),
);
const { parseSeasonalReport } = await loadTypeScript(
  new URL("../src/lib/seasonal-report.ts", import.meta.url),
);
const { analysis } = await loadTypeScript(new URL("../src/data/study.ts", import.meta.url));

test("original October pair is an explicitly exploratory, processed comparison", () => {
  const result = checkComparison(
    originalRadarPair.a,
    originalRadarPair.b,
    observationRegistry,
    comparisonRegistry,
  );
  assert.equal(result.comparison.type, "radar");
  assert.match(result.reason, /Unverified/);
});
test("original NISAR observations appear before other sources on the same dates", () => {
  for (const id of Object.values(originalRadarPair)) {
    const original = observationRegistry.find((o) => o.id === id);
    const sameDate = observationRegistry.filter((o) => o.date === original.date);
    assert.ok(sameDate.some((o) => o.kind === "optical-browse"));
    assert.equal(sameDate[0].id, id);
  }
});
test("catalog dates, identical observations and unsupported reverse order cannot generate differences", () => {
  const candidate = observationRegistry.find((o) => o.status === "catalog-only");
  assert.ok(candidate);
  assert.equal(candidate.asset, null);
  assert.equal(candidate.coveragePercent, null);
  for (const [a, b] of [
    [candidate.id, originalRadarPair.a],
    [originalRadarPair.a, originalRadarPair.a],
    [originalRadarPair.b, originalRadarPair.a],
    ["unknown", originalRadarPair.b],
  ]) {
    const result = checkComparison(a, b, observationRegistry, comparisonRegistry);
    assert.equal(result.comparison, null);
    assert.ok(result.reason);
  }
});
test("category highlights preserve report counts including invalid pixels", () => {
  assert.equal(radarCategories.length, 4);
  assert.equal(
    radarCategories.reduce((n, c) => n + c.pixels, 0),
    analysis.quality.totalPixels,
  );
  assert.equal(
    radarCategories.find((c) => c.key === "invalid").pixels,
    analysis.quality.invalidPairedPixels,
  );
  for (const c of radarCategories) assert.ok(c.asset.url.startsWith("/data/display/"));
});
test("missing seasonal rasters never produce zero measurements or fictitious observation layers", () => {
  if (seasonal.status === "unavailable") {
    assert.equal(seasonal.metrics, null);
    assert.deepEqual(seasonal.observations, []);
    assert.deepEqual(seasonal.assets, {});
    assert.equal(
      comparisonRegistry.some((c) => c.type === "seasonal"),
      false,
    );
  }
  assert.equal(new Set(observationRegistry.map((o) => o.id)).size, observationRegistry.length);
});
test("incomplete seasonal output cannot enable classification controls", () => {
  assert.throws(() => parseSeasonalReport({ ...seasonal, status: "classified", metrics: {} }));
  assert.throws(() =>
    parseSeasonalReport({
      ...seasonal,
      bounds: [
        [26, 91],
        [25, 90],
      ],
    }),
  );
});

// Synthetic schema fixture only; never exported to the application's public assets.
test("a complete classification report enables the matrix, while inconsistent water areas are rejected", () => {
  const asset = {
    url: "/data/display/seasonal-bothDates-fixture.webp",
    bytes: 10,
    width: 2,
    height: 2,
    projection: "EPSG:3857",
    encoding: "lossless WebP",
  };
  const fixture = {
    ...seasonal,
    status: "classified",
    reason: "Synthetic schema fixture",
    areaMethod: "test cells",
    observations: ["dry", "wet"].map((season) => ({
      id: `fixture-${season}`,
      date: season === "dry" ? "2026-01-15" : "2026-08-15",
      season,
      mission: "Test fixture",
      productId: `fixture-${season}`,
      productType: "DSWx-HLS-WTR-v1",
      processingVersion: "1.1",
      sourceUrl: "https://example.org",
      asset,
    })),
    assets: { dry: asset, wet: asset, change: asset },
    metrics: {
      pairedPixels: 4,
      unknownPixels: 1,
      coveragePercent: 80,
      comparedAreaKm2: 4,
      dryWaterAreaKm2: 2,
      wetWaterAreaKm2: 2,
      netDifferenceKm2: 0,
      transitions: ["bothDates", "wetOnly", "dryOnly", "neither"].map((key, code) => ({
        key,
        code,
        label: key,
        pixels: 1,
        areaKm2: 1,
        percentValidArea: 25,
        asset,
      })),
    },
  };
  assert.equal(parseSeasonalReport(fixture).status, "classified");
  assert.throws(
    () =>
      parseSeasonalReport({
        ...fixture,
        metrics: { ...fixture.metrics, dryWaterAreaKm2: 99, netDifferenceKm2: -97 },
      }),
    /accounting/,
  );
});
