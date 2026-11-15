# Public NASA imagery in the shared observation registry

20 NASA GIBS MODIS Terra daily true-color browse images were retrieved for 2026 dates
from January through November. The existing catalog-date requests succeeded on 10 of
11 dates. Monthly samples add calendar coverage; these are selected dates, not an
assertion of continuous daily coverage. January 1 and October 15 returned unusable/blank
imagery and were not integrated. The report lists all accepted/rejected requests.

- Source: https://nasa-gibs.github.io/gibs-api-docs/access-basics/
- Layer: `MODIS_Terra_CorrectedReflectance_TrueColor`, approximately 250 m native detail.
- Exact date availability checked against the WMS capabilities time dimension.
- Georeferencing: actual analysis bounds transformed to EPSG:3857; WMS PNGs are
  encoded as small local WebP images, with content hashes in filenames.
- Total integrated WebP size: 169,350 bytes. Original NISAR assets are unchanged.
- These are optical visualizations, not calibrated science rasters, classifications,
  NISAR observations, water-area results or cloud-free coverage guarantees. Many views
  include clouds. Daily composite dates are not exact acquisition timestamps.

`public/data/public-imagery.json` records the capabilities URL, time extent, exact source
requests, bounds, dimensions, bytes and rejected dates. `src/data/public-imagery.ts`
and `src/data/observations.ts` expose one shared registry for calendar, navigation,
map and Insights. No consumer imports generated JSON directly.

A catalog-only record can reference a separate same-date optical context record.
Selecting it displays a visible source-switch explanation, while the catalog record
remains unprocessed. “Use NASA optical image” selects the actual optical observation
for A/B comparison. Only pairs of the same optical product support visual swipe;
there is no pixel subtraction or water-change calculation. Insights describes the
selected source and limitations instead of substituting October radar statistics.

Reproduce: `.venv/bin/python processing/scripts/acquire_public_imagery.py`.
The script uses no authentication, limits image sizes/counts, and rejects empty images
and dates outside published daily availability. It introduces no new dependencies.

Validation: TypeScript, lint, frontend tests, production build, plus
`node tests/public-imagery-browser.mjs http://127.0.0.1:3000` for the exact June 2 catalog
selection, image loading, shared navigation and optical Insights. This is a public
imagery extension; the separate scientific seasonal-classification blocker remains.
