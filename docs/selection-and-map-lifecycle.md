# Shared observation selection and map lifecycle

## One selection for the workspace

`WorkspaceProvider` in the root layout owns A/B observation IDs, the focused observation,
analysis mode, active view and calendar year/month. `workspace-selection.ts` validates
URL values against the observation registry and builds internal links. Selection changes
update the current URL without fetching a new page; Explore/Insights navigation carries
that URL state. Reloads, shared URLs and browser history restore the selected records.

Calendar date cards and A/B dropdowns update this same selection. A processed date opens
its real image. The selected-data panel appears beside navigation and on both pages;
it includes a collapsible observation editor, pair-analysis action and reset control.

Insights distinguishes a focused single observation from a comparison. Single-date
intensity metrics use the original study's paired-valid population, as explicitly
labeled. The full October histogram and difference metrics appear only for the supported
processed pair. Catalog-only/unsupported selections show no substitute statistics.
Seasonal mode continues to report the existing data-access limitation.

## Why the overlay crashed

Next.js cached route navigation can hide and restore a page using React Activity.
Activity disconnects effects while preserving component state and DOM. React Leaflet
5's MapContainer effect cleanup removes the Leaflet map but retains its context; on
restoration, an ImageOverlay can then try to append to a pane that no longer exists.
The crash was reproduced during Explore -> Insights -> Explore navigation.

`ManagedMap` keeps the external map and its panes with the connected preserved DOM.
Layer effects can safely disconnect/reconnect against the same live map. It disposes
the instance when the DOM is actually detached, including eviction of an already-hidden
route; a disconnect observer is active only while hidden. Automatic window resize
tracking is disabled because MapControls already owns a scoped ResizeObserver.
No dependency patches, global Leaflet overrides or suppressed errors are used.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm test
npm run format:check
npm run build
npm start -- --hostname 127.0.0.1 --port 3127
node tests/workspace-browser.mjs http://127.0.0.1:3127
node tests/browser-smoke.mjs http://127.0.0.1:3127
node tests/http-smoke.mjs http://127.0.0.1:3127
```

The workspace browser regression selects October 30 in the calendar, verifies its
image and actual intensity metrics on Insights, returns to the processed pair, cycles
through all four routes to exercise cache restoration/eviction, checks catalog-only
selection guards and tests reload persistence. The Chrome harness is shared with the
existing interaction smoke test and uses a fresh isolated profile.
