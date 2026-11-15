import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadTypeScript } from "./support/load-typescript.mjs";

const { analysis, observations, changeCategories, changeThresholdDb, radarLayers } =
  await loadTypeScript(new URL("../src/data/study.ts", import.meta.url));
const { assertMatchingAnalysis } = await loadTypeScript(
  new URL("../src/lib/radar.ts", import.meta.url),
);
const metadata = JSON.parse(
  await readFile(new URL("../public/data/metadata.json", import.meta.url), "utf8"),
);

test("shared observations preserve the generated dates, measurements and exact overlay URLs", () => {
  assert.doesNotThrow(() => assertMatchingAnalysis(metadata));
  for (const observation of observations) {
    assert.equal(observation.date, analysis[`${observation.key}Date`]);
    assert.deepEqual(observation.stats, analysis[observation.key]);
    assert.deepEqual(observation.asset, analysis.assets[observation.key]);
    assert.equal(radarLayers[observation.key].url, observation.asset.url);
    assert.equal(observation.date, metadata[`${observation.key}Date`]);
  }
});

test("the viewer rejects a stale date, location, threshold or geographic extent", () => {
  for (const change of [
    { beforeDate: "2026-10-05" },
    { afterDate: "2026-10-31" },
    { location: "Different study area" },
    { changeThresholdDb: changeThresholdDb + 1 },
    { bounds: [[24.9, 90.95], metadata.bounds[1]] },
  ]) {
    assert.throws(
      () => assertMatchingAnalysis({ ...metadata, ...change }),
      /Metadata and analysis differ/,
    );
  }
});

test("legend categories retain all measured pixels and the report's threshold", () => {
  assert.equal(changeCategories.length, analysis.categories.length);
  assert.equal(
    changeCategories.reduce((sum, category) => sum + category.pixels, 0),
    analysis.quality.pairedValidPixels,
  );
  for (const category of changeCategories) {
    const measured = analysis.categories.find((item) => item.key === category.key);
    assert.equal(category.percentValid, measured.percentValid);
    assert.equal(category.pixels, measured.pixels);
    assert.ok(category.label);
    assert.ok(category.range.includes(`${analysis.processing.thresholdDb} dB`));
  }
});
