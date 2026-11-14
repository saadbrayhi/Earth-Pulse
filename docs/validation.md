# Validation performed

## Passed on the final source revision

- `npm run lint`: no errors or warnings.
- `npx tsc --noEmit`: successful.
- `npm test`: four actual swipe geometry tests (viewport offset, pan, zoom, endpoint and invalid-dimension cases).
- `.venv/bin/python -m unittest discover -s processing/tests -v`: six processing tests, including direct recomputation from the original source powers, checksums, category/histogram totals, equal-area accounting, and exact lossless palette values.
- The offline pipeline was run repeatedly. Its three content-addressed preview hashes remained unchanged.
- `git diff --check`: successful.
- Original GeoTIFFs, original PNGs, original `metadata.json` and legacy `prepare_radar.py`: no diff.

## Earlier production revision passed

`npm run build` succeeded with Webpack and the standard Tailwind PostCSS adapter, including TypeScript checking and static prerendering of `/`, `/explore`, `/insights`, and `/about`.

`node tests/http-smoke.mjs http://127.0.0.1:3001` then passed against that production build:

- All four pages returned 200 with correct headings, navigation links and scientific interpretation notices.
- The insights HTML contained the actual source-derived valid-pixel count and mean difference.
- Leaflet was absent from the server-rendered DOM.
- All three optimized previews matched local files byte for byte, matched their filename hashes, had WebP content types, and had immutable cache headers.
- All five JSON/GeoJSON endpoints parsed correctly.
- Missing preview and route requests returned 404.

Subsequent source edits fixed the date-selector state, made optional reference metadata robust, and added historical-reference context. Lint and TypeScript passed afterward. The final production rebuild inside the sandbox failed because Next.js's TypeScript `--showConfig` subprocess returned unparsable/empty output. Permission to repeat that last build outside the sandbox was declined, so the final source revision is **not claimed to have completed a production build**. Run `npm run build` locally before deployment.

## Not tested / not delivered

- Browser interaction, screenshot review, responsive layout in a real browser, focus navigation, missing-asset retry clicks, and browser-console hydration/map initialization checks: no managed Browser connection was available.
- Geometry tests verify clipping calculations, not live Leaflet DOM interaction.
- NASA catalog discovery succeeded; two near-date DSWx-HLS GDAL access probes did not retrieve usable references. No independent water classification or accuracy evaluation was performed.
- No live Vercel deployment was performed. README includes deployment instructions.
- No commit, push, merge or pull request was created.

Turbopack's production worker was blocked by a local-port permission error. The project uses the documented Webpack production option instead. System fonts remove the earlier Google Fonts network prerequisite. No framework package was patched or validation check bypassed.
