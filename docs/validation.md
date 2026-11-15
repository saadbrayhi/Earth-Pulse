# Latest validation: linked selection and cached map navigation

## Passed

- `npm run lint`: no errors or warnings.
- `npx tsc --noEmit`: successful.
- `npm run format:check`: all frontend/test files formatted.
- `npm test`: 27 tests covering geometry, metadata, themes, shared data, registered
  comparison guards, category accounting and seasonal-report acceptance/rejection.
- `.venv/bin/python -m unittest discover -s processing/tests -v`: 18 tests covering
  existing radar calculations plus water-class decoding, unknown exclusion, net-change
  signs, conservation, categorical previews and the complete seasonal pipeline on
  isolated temporary test fixtures. No fixture data is published as an observation.
- `npm run build`: Webpack production build; all four routes statically prerendered.
- Production HTTP smoke: all four pages, shared styles, generated JSON, all seven radar
  previews/masks, exact image bytes/content hashes, immutable image caching and 404s.
- Isolated headless Chrome: actual original overlays; Before/After/Change/Swipe;
  pointer and keyboard divider movement; one reused map during mode switching;
  seasonal unavailable controls; actual category highlights; disabled catalog-only
  comparisons; calendar filtering; all five story chapters; all six themes; mobile
  horizontal fit at 390 px; controlled metadata/image errors and successful Retry.
  No runtime, hydration or map-initialization errors were recorded.
- Desktop map, mobile explorer and historical-impact screenshots visually inspected.
- Four radar category masks match unchanged full-grid counts. Original source TIFFs,
  original report/metadata/PNGs and legacy preparation script are unchanged.

The managed Browser connection was unavailable. Interaction QA instead used installed
Chrome with an isolated temporary profile and no access to personal browser sessions.
Screenshots are saved under the temporary path printed by `tests/browser-smoke.mjs`.
This is not a complete assistive-technology, cross-browser or scientific accuracy audit.

## Remaining limitation

NASA catalog discovery succeeded. Bounded DSWx raster-access probes did not yield
usable pixels, so the seasonal result is explicitly unavailable. No selected wet/dry
analysis pair, water-area results or local classification accuracy are claimed. The
classified-data branch was exercised with synthetic temporary processing/schema
fixtures, not a real seasonal observation pair or a real seasonal map in the browser.

External historical claims carry source, date and geographic scope. Some external
publishers block automated requests; the local HTTP/browser checks do not promise
continued availability of their websites. EarthPulse is not an operational warning system.
No deployment, commit or push was performed.

See [the extension report](seasonal-extension.md) for source records, scientific
contracts, files changed, discovered products, blockers and reproduction commands.

## Linked-selection regression

- Development (Turbopack) and production (Webpack): selecting October 30 in the calendar
  shows its actual image and single-date paired-population intensity metrics on Insights.
- Supported pair selection restores the full October difference statistics. Catalog-only
  records show unavailable data, never substitute the October measurements.
- The selection is visible in navigation and on both pages; native URL updates and
  internal links preserve IDs, focused date, mode, view and calendar filters. Reload
  restoration passed. Unit tests cover round trips and invalid URL parameters.
- Repeated client navigation through all four routes passed without the reported
  `appendChild` crash, hydration errors or duplicate-map initialization errors.
- `tests/workspace-browser.mjs` covers these scenarios using the shared isolated Chrome
  harness. The original map/theme/mobile/error-recovery smoke also passed after the fix.

See [selection and lifecycle notes](selection-and-map-lifecycle.md) for implementation
and reproduction details. Processing inputs, scientific calculations and imagery were
not changed in this follow-up.

## Public optical imagery extension

30 frontend tests, lint, TypeScript, formatting and production build passed. All 20
new optical assets passed HTTP byte/hash/cache checks. Isolated Chrome verified the
June 2 catalog-to-optical context fallback, shared navigation, optical Insights with
no borrowed radar statistics, and a two-date optical comparison. Source acquisition
records and rejected dates are documented in `public-imagery.md`.
