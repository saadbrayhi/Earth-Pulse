import assert from "node:assert/strict";
import { withTestBrowser } from "./support/chrome.mjs";
const base = process.argv[2] ?? "http://127.0.0.1:3127";
await withTestBrowser(async ({ send, evaluate, until, screenshot, errors, folder }) => {
  await send("Page.navigate", {
    url:
      base +
      "/explore?a=G4208356157-POCLOUD&b=radar-2026-10-30&mode=radar&view=before&focus=G4208356157-POCLOUD&year=2026&month=06",
  });
  await until(
    "[...document.querySelectorAll('.leaflet-image-layer')].some(i=>i.src.includes('gibs-2026-06-02')&&i.complete&&i.naturalWidth>0)",
  );
  assert.ok(
    (await evaluate("document.getElementById('main-content').innerText")).includes("not NISAR"),
  );
  await screenshot("public-optical-map");
  await evaluate("document.querySelector('.site-navigation a[href^=\"/insights\"]').click()");
  await until("document.querySelector('[aria-label=\"Optical imagery insights\"]')!==null");
  assert.ok(
    !(await evaluate("document.getElementById('main-content').innerText")).includes(
      "MEAN BACKSCATTER DIFFERENCE",
    ),
  );
  await screenshot("public-optical-insights");
  await send("Page.navigate", {
    url:
      base + "/explore?a=gibs-modis-2026-01-15&b=gibs-modis-2026-06-02&mode=imagery&view=compare",
  });
  await until(
    "document.querySelectorAll('.leaflet-image-layer').length===2 && [...document.querySelectorAll('.leaflet-image-layer')].every(i=>i.complete&&i.naturalWidth>0) && document.querySelector('.swipe-handle')!==null",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS official June 2 public image fallback, shared navigation and optical Insights without radar statistics.",
  );
  console.log("Screenshots: " + folder);
});
