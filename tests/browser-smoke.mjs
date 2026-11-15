import assert from "node:assert/strict";
import { withTestBrowser } from "./support/chrome.mjs";
const base = process.argv[2] ?? "http://127.0.0.1:3127";
await withTestBrowser(async ({ send, evaluate, until, click, screenshot, errors, folder }) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: base + "/explore" });
  await until(
    "document.querySelectorAll('.leaflet-image-layer').length===3 && [...document.querySelectorAll('.leaflet-image-layer')].every(i=>i.complete&&i.naturalWidth>0) && !document.querySelector('.map-image-status')",
  );
  await evaluate("void(window.__qaMap=document.querySelector('.leaflet-container'))");
  for (const label of ["Before", "After", "Change", "Swipe"]) {
    await click(label);
    await until(
      `document.querySelector('[aria-label="Radar layer"] button[aria-pressed="true"]').textContent.trim()===${JSON.stringify(label)}`,
    );
  }
  await until("document.querySelector('.swipe-handle')?.getAttribute('aria-valuenow')==='50'");
  await evaluate("document.querySelector('.swipe-handle').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight" });
  await until("document.querySelector('.swipe-handle').getAttribute('aria-valuenow')==='55'");
  await evaluate("document.getElementById('explore-workspace').scrollIntoView()");
  const handle = await evaluate(
    "(()=>{const r=document.querySelector('.swipe-handle').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()",
  );
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: handle.x,
    y: handle.y,
    button: "left",
    clickCount: 1,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: handle.x + 80,
    y: handle.y,
    button: "left",
    buttons: 1,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: handle.x + 80,
    y: handle.y,
    button: "left",
    clickCount: 1,
  });
  await until("Number(document.querySelector('.swipe-handle').getAttribute('aria-valuenow'))>55");
  assert.ok(
    await evaluate(
      "[...document.querySelectorAll('.leaflet-image-layer')].filter(i=>i.style.opacity!=='0').every(i=>i.style.clipPath.includes('inset'))",
    ),
  );
  await screenshot("desktop-explorer");
  await click("Seasonal Dynamics");
  await until("document.querySelector('.seasonal-map-empty')!==null");
  for (const label of ["Wet Season", "Dry Season", "Compare", "Seasonal Change"])
    await click(label);
  assert.ok(
    await evaluate(
      "document.getElementById('seasonal-dynamics').textContent.includes('Seasonal analysis is unavailable.')",
    ),
  );
  await click("Radar Change");
  await until(
    "document.querySelectorAll('.leaflet-image-layer').length===3 && !document.querySelector('.map-image-status')",
  );
  assert.ok(
    await evaluate("window.__qaMap===document.querySelector('.leaflet-container')"),
    "Mode changes must reuse one map instance",
  );
  await evaluate("document.querySelector('.radar-category-decreased').click()");
  await until(
    "document.querySelector('.radar-category-decreased').getAttribute('aria-pressed')==='true' && [...document.querySelectorAll('.leaflet-image-layer')].some(i=>i.src.includes('radar-decreased')&&i.style.opacity!=='0')",
  );
  await click("Clear category highlight");
  const selectCandidate = `(()=>{const s=document.querySelectorAll('.observation-selectors select')[1];const option=[...s.options].find(o=>o.textContent.includes('catalog only'));s.value=option.value;s.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`;
  await evaluate(selectCandidate);
  await until(
    "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Compare selected observations').disabled",
  );
  assert.ok(
    await evaluate(
      "document.getElementById('comparison-reason').textContent.includes('Catalog discovery only')",
    ),
  );
  await evaluate(
    "[...document.querySelectorAll('.observation-calendar button')].find(b=>b.querySelector('strong').textContent==='Feb').click()",
  );
  await until(
    "document.querySelector('.observation-calendar button[aria-pressed=true] strong').textContent==='Feb'",
  );
  await evaluate("document.querySelector('.calendar-heading').scrollIntoView()");
  await screenshot("observation-calendar");
  await click("Explore the story");
  for (let index = 1; index < 5; index++) {
    await click("Next");
    await until(
      `document.querySelector('.story-step-heading').textContent.includes('CHAPTER ${index + 1} / 5')`,
    );
  }
  await screenshot("guided-story");
  await click("Finish");
  await until("!document.querySelector('.guided-story')");
  for (const [id, name] of [
    ["orbit", "Midnight Orbit"],
    ["aurora", "Aurora Grove"],
    ["dusk", "Solar Dusk"],
    ["glacier", "Glacier"],
    ["nebula", "Nebula"],
    ["ivory", "Haor Ivory"],
  ]) {
    await evaluate("document.querySelector('.theme-trigger').click()");
    await evaluate(
      `document.querySelectorAll('.theme-option').forEach(b=>{if(b.textContent.includes(${JSON.stringify(name)}))b.click()})`,
    );
    await until(`document.documentElement.dataset.theme===${JSON.stringify(id)}`);
  }
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await evaluate("window.scrollTo(0,0)");
  await new Promise((r) => setTimeout(r, 250));
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"),
    "Mobile page must not overflow horizontally",
  );
  await screenshot("mobile-explorer");
  await evaluate("document.getElementById('why-changes-matter').scrollIntoView()");
  await screenshot("mobile-impact");
  await click("Swipe");
  // Deliberately fail the local metadata and then one overlay; both must recover via Retry.
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Fetch.enable", {
    patterns: [{ urlPattern: "*/data/metadata.json*", requestStage: "Request" }],
  });
  await send("Page.reload", { ignoreCache: true });
  await until(
    "document.querySelector('.metadata-status')?.textContent.includes('Study metadata unavailable')",
  );
  await send("Fetch.disable");
  await click("Try again");
  await until(
    "document.querySelectorAll('.leaflet-image-layer').length===3 && !document.querySelector('.map-image-status')",
  );
  await send("Fetch.enable", {
    patterns: [{ urlPattern: "*/data/display/before-*.webp*", requestStage: "Request" }],
  });
  await send("Page.reload", { ignoreCache: true });
  await until(
    "document.querySelector('.map-image-status')?.textContent.includes('image unavailable')",
  );
  await send("Fetch.disable");
  await click("Try again");
  await until(
    "!document.querySelector('.map-image-status') && document.querySelectorAll('.leaflet-image-layer').length===3",
  );
  assert.deepEqual(errors, [], "No runtime, hydration or map initialization errors");
  console.log(
    "PASS: actual overlays, Before/After/Change/Swipe, keyboard and pointer divider, reused map, seasonal unavailable controls, category highlight, comparison guards, calendar, five story chapters, six themes, mobile width, metadata/overlay failure recovery, zero runtime errors.",
  );
  console.log("Screenshots: " + folder);
});
