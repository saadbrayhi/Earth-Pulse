import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./support/load-typescript.mjs";

const { imageSplitPercent } = await loadTypeScript(
  new URL("../src/lib/map-clip.ts", import.meta.url),
);

test("divider intersects the same viewport position after a pan", () => {
  assert.equal(imageSplitPercent(100, 800, 100, 800, 50), 50);
  assert.equal(imageSplitPercent(100, 800, -100, 800, 50), 75);
  assert.equal(imageSplitPercent(100, 800, 300, 800, 50), 25);
});

test("zoomed image uses its own width, with viewport offsets", () => {
  assert.equal(imageSplitPercent(100, 800, -300, 1600, 25), 37.5);
  assert.equal(imageSplitPercent(100, 800, -300, 1600, 75), 62.5);
});

test("offscreen image and endpoint clips remain bounded", () => {
  assert.equal(imageSplitPercent(0, 400, 100, 200, 0), 0);
  assert.equal(imageSplitPercent(0, 400, 100, 200, 100), 100);
  assert.equal(imageSplitPercent(0, 400, 600, 200, 50), 0);
  assert.equal(imageSplitPercent(0, 400, -600, 200, 50), 100);
});

test("invalid dimensions never produce a NaN clip path", () => {
  assert.throws(() => imageSplitPercent(0, 400, 0, 0, 50));
  assert.throws(() => imageSplitPercent(0, 400, 0, 200, NaN));
});
