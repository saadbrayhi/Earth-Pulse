import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadTypeScript } from "./support/load-typescript.mjs";

const { parseRadarMetadata } = await loadTypeScript(
  new URL("../src/lib/radar-metadata.ts", import.meta.url),
);
const { formatObservationDate } = await loadTypeScript(
  new URL("../src/lib/format.ts", import.meta.url),
);
const metadata = JSON.parse(
  await readFile(new URL("../public/data/metadata.json", import.meta.url), "utf8"),
);

test("actual metadata retains the supplied dates, coordinates and threshold", () => {
  assert.deepEqual(parseRadarMetadata(metadata), metadata);
  assert.equal(formatObservationDate(metadata.beforeDate), "06 Oct 2026");
  assert.equal(formatObservationDate(metadata.afterDate), "30 Oct 2026");
});

test("invalid or reversed geographic bounds are rejected", () => {
  for (const bounds of [
    [
      [90, 0],
      [91, 1],
    ],
    [
      [25, 91],
      [25, 92],
    ],
    [
      [26, 91],
      [25, 92],
    ],
    [
      [25, 91],
      [26, 90],
    ],
    [
      [25, NaN],
      [26, 92],
    ],
  ]) {
    assert.throws(() => parseRadarMetadata({ ...metadata, bounds }));
  }
});

test("impossible dates, empty provenance and invalid thresholds are rejected", () => {
  for (const change of [
    { beforeDate: "2026-02-30" },
    { beforeDate: metadata.afterDate },
    { afterDate: "06-10-2026" },
    { measurement: " " },
    { location: null },
    { changeThresholdDb: 0 },
    { changeThresholdDb: Infinity },
  ]) {
    assert.throws(() => parseRadarMetadata({ ...metadata, ...change }));
  }
});
