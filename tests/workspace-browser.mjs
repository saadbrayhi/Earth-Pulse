import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { withTestBrowser } from "./support/chrome.mjs";
const base = process.argv[2] ?? "http://127.0.0.1:3127";
const report = JSON.parse(
  await readFile(new URL("../public/data/analysis.json", import.meta.url), "utf8"),
);
await withTestBrowser(async ({ send, evaluate, until, click, screenshot, errors, folder }) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  // Reproduce the reported legacy URL: October dates match, but A points at MODIS.
  await send("Page.navigate", {
    url:
      base +
      "/explore?a=gibs-modis-2026-10-06&b=radar-2026-10-30&mode=radar&view=compare&year=2026&month=10",
  });
  const mapReady =
    "document.querySelectorAll('.leaflet-image-layer').length===3 && [...document.querySelectorAll('.leaflet-image-layer')].every(i=>i.complete&&i.naturalWidth>0) && !document.querySelector('.map-image-status')";
  await until(mapReady);
  async function nav(path) {
    await evaluate(`document.querySelector('.site-navigation a[href^="${path}"]').click()`);
    await until(`location.pathname==='${path}'`);
  }
  const originalPair =
    "new URLSearchParams(location.search).get('a')==='radar-2026-10-06' && new URLSearchParams(location.search).get('b')==='radar-2026-10-30' && new URLSearchParams(location.search).get('mode')==='radar'";
  await until(originalPair);
  assert.ok(
    !(await evaluate("document.getElementById('main-content').innerText")).includes(
      "Selected data unavailable",
    ),
  );
  for (const [button, asset] of [
    ["Before", "before"],
    ["After", "after"],
    ["Change", "change"],
  ]) {
    await click(button);
    await until(
      `[...document.querySelectorAll('.leaflet-image-layer')].some(i=>i.src.includes('/${asset}-')&&i.style.opacity==='1')`,
    );
    await until(originalPair);
  }
  await click("Public imagery");
  await click("Radar Change");
  await until(mapReady);
  await until(originalPair);
  await click("Public imagery");
  await click(`Original NISAR study · ${report.beforeDate} → ${report.afterDate}`);
  await until(mapReady);
  await until(originalPair);
  await screenshot("restored-original-nisar");
  // Calendar selection drives the image, URL, navigation badge and the Insights dataset.
  await evaluate(
    "(()=>{const card=[...document.querySelectorAll('.observation-days article')].find(a=>a.querySelector('time').textContent==='2026-10-30');[...card.querySelectorAll('button')].find(b=>b.textContent==='Select B').click()})()",
  );
  await until("new URLSearchParams(location.search).get('focus')==='radar-2026-10-30'");
  await until(
    "[...document.querySelectorAll('.leaflet-image-layer')].some(i=>i.src.includes('/after-')&&i.style.opacity==='1')",
  );
  await screenshot("selected-date-map");
  await nav("/insights");
  await until(
    "document.querySelector('[aria-label=\"Selected observation insights\"]')?.innerText.includes('2026-10-30')",
  );
  const singleText = await evaluate("document.getElementById('main-content').innerText");
  assert.ok(singleText.includes(report.after.meanDb.toFixed(2)));
  assert.ok(!singleText.includes("MEAN BACKSCATTER DIFFERENCE"));
  await screenshot("selected-date-insights");
  await nav("/explore");
  await until(mapReady);
  assert.equal(
    await evaluate("new URLSearchParams(location.search).get('focus')"),
    "radar-2026-10-30",
  );
  await click("Compare selected observations");
  await until("!new URLSearchParams(location.search).has('focus')");
  await nav("/insights");
  await until(
    "document.getElementById('main-content').innerText.includes('MEAN BACKSCATTER DIFFERENCE')",
  );
  assert.ok(
    (await evaluate("document.getElementById('main-content').innerText")).includes(
      report.delta.meanDb.toFixed(2),
    ),
  );
  for (let i = 0; i < 4; i++) {
    await nav("/explore");
    await until(mapReady);
    await nav("/about");
    await nav("/");
    await nav("/insights");
  }
  await nav("/explore");
  await until(mapReady);
  await evaluate(
    "(()=>{const s=document.querySelectorAll('.observation-selectors select')[1];s.value=[...s.options].find(o=>o.textContent.includes('catalog only')).value;s.dispatchEvent(new Event('change',{bubbles:true}));})()",
  );
  await until(
    "document.querySelector('.seasonal-map-empty')?.innerText.includes('Selected data unavailable')",
  );
  await nav("/insights");
  await until("document.querySelector('[aria-label=\"Selected insights unavailable\"]')!==null");
  assert.ok(
    !(await evaluate("document.getElementById('main-content').innerText")).includes(
      "MEAN BACKSCATTER DIFFERENCE",
    ),
  );
  await click("Reset selection");
  await until(
    "document.getElementById('main-content').innerText.includes('MEAN BACKSCATTER DIFFERENCE')",
  );
  await nav("/explore");
  await until(mapReady);
  await send("Page.reload", { ignoreCache: true });
  await until(mapReady);
  assert.deepEqual(
    errors,
    [],
    "No lifecycle, hydration or runtime errors during cached navigation/eviction",
  );
  console.log(
    "PASS: calendar -> map -> navigation -> single-date Insights; pair Insights; URL/reload persistence; catalog-only guards; repeated cached navigation and route eviction; zero runtime errors.",
  );
  console.log("Screenshots: " + folder);
});
