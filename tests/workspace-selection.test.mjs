import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./support/load-typescript.mjs";
const { defaultSelection, parseWorkspaceSelection, selectionParams, selectionHref } =
  await loadTypeScript(new URL("../src/lib/workspace-selection.ts", import.meta.url));
test("selected observation, pair, month and active view survive a shareable URL", () => {
  const selected = {
    ...defaultSelection,
    focusId: defaultSelection.b,
    radarView: "after",
    month: "10",
  };
  assert.deepEqual(parseWorkspaceSelection(selectionParams(selected)), selected);
  assert.ok(selectionHref("/insights", selected).startsWith("/insights?a="));
});
test("unrecognized IDs, views, years and months cannot become datasets", () => {
  const parsed = parseWorkspaceSelection(
    new URLSearchParams({
      a: "not-an-observation",
      b: "<script>",
      focus: "fake",
      view: "unknown",
      year: "9999",
      month: "13",
    }),
  );
  assert.deepEqual(parsed, defaultSelection);
});
test("all-month filtering and seasonal mode serialize without manufacturing observations", () => {
  const selected = { ...defaultSelection, mode: "seasonal", seasonalView: "wet", month: null };
  const parsed = parseWorkspaceSelection(selectionParams(selected));
  assert.equal(parsed.mode, "seasonal");
  assert.equal(parsed.seasonalView, "wet");
  assert.equal(parsed.month, null);
  assert.equal(parsed.a, defaultSelection.a);
  assert.equal(parsed.b, defaultSelection.b);
});
test("legacy mixed-source October radar links restore the original NISAR pair", () => {
  for (const view of ["compare", "change"]) {
    const parsed = parseWorkspaceSelection(
      new URLSearchParams({
        a: "gibs-modis-2026-10-06",
        b: defaultSelection.b,
        mode: "radar",
        view,
        year: "2026",
        month: "10",
      }),
    );
    assert.equal(parsed.a, defaultSelection.a);
    assert.equal(parsed.b, defaultSelection.b);
    assert.equal(parsed.radarView, view);
    assert.equal(parsed.focusId, null);
    assert.deepEqual(parseWorkspaceSelection(selectionParams(parsed)), parsed);
  }
});
test("optical studies and focused optical observations keep their actual source", () => {
  const optical = {
    ...defaultSelection,
    a: "gibs-modis-2026-10-06",
    b: "gibs-modis-2026-10-30",
    mode: "imagery",
  };
  assert.deepEqual(parseWorkspaceSelection(selectionParams(optical)), optical);
  const focused = parseWorkspaceSelection(
    selectionParams({ ...optical, mode: "radar", focusId: optical.a }),
  );
  assert.equal(focused.mode, "imagery");
  assert.equal(focused.a, optical.a);
  assert.equal(focused.focusId, optical.a);
});
test("unsupported radar pairs on other dates remain explicit instead of being replaced", () => {
  const parsed = parseWorkspaceSelection(
    selectionParams({ ...defaultSelection, a: "gibs-modis-2026-06-02" }),
  );
  assert.equal(parsed.a, "gibs-modis-2026-06-02");
  assert.equal(parsed.b, defaultSelection.b);
});
