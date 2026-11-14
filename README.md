# EarthPulse — a wetland's changing radar signal

EarthPulse is a NASA Space Apps 2026 project for **Dancing with the SARs**, on the **Water & Wetlands Monitoring** track. It makes two supplied NASA/ISRO NISAR observations over **Tanguar Haor, Bangladesh** inspectable through synchronized maps, measured statistics and transparent explanations.

**Radar backscatter change is NOT validated flood extent.** EarthPulse demonstrates radar-change exploration, not operational flood detection or a validated water classifier.

## The experience

- `/`: public project homepage using an actual radar observation, with study context and an explorer action.
- `/explore`: before, after, synchronized swipe and backscatter-change views; date selection, opacity, fit/zoom controls, real study-region GeoJSON, legends and recoverable loading/error states.
- `/insights`: full-resolution difference histogram, category percentages, coverage, two-observation record, downloadable statistics and deterministic explanations.
- `/about`: methods, provenance gaps, supplemental investigation, sources and scientific limitations.

The default interface uses light ivory, forest green and muted gold. Radar imagery retains a dark neutral canvas and its scientific blue/orange change colors. The palette is centralized in `src/styles/theme.css`; Tailwind utilities and charts use the same semantic variables. The core application requires no account, database, tile server, live NASA authentication, remote font or external AI API. The explanation panel is deterministic and grounded in the computed report.

## Color themes

Use **Theme** in the header on any page to choose Haor Ivory, Midnight Orbit, Aurora Grove, Solar Dusk, Glacier or Nebula. Palette previews show each option; three are light and three are dark. The choice is saved locally, restored before paint on reload, preserved through navigation, and synchronized across tabs. The picker supports keyboard navigation and Escape. If storage is blocked, theme selection still works for the current page session.

Theme metadata and persistence live in `src/lib/themes.ts`, the reusable picker in `src/components/ui/theme-switcher.tsx`, and palette overrides in `src/styles/theme.css`. Scientific blue/orange colors and the radar canvas stay consistent across themes. No external service or theme dependency is required.

## Stack

Next.js 16.4.6 App Router, React 19.3, TypeScript, Tailwind CSS 4.3.3, Leaflet 1.9.4 / React Leaflet 5, Recharts 3 and Lucide React. Processing uses Python, NumPy, Rasterio and Pillow. Optional discovery uses Python's standard library; the bounded reference-access probe uses GDAL bindings.

## Install and run

Use Node.js 24 and npm:

```bash
npm ci
npm run dev
```

Open **http://localhost:3000**. The homepage is now a real EarthPulse page; the explorer is **http://localhost:3000/explore**.

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm start
```

The production build uses the supported Webpack option. Turbopack's production CSS worker was denied local port binding in the managed execution environment. Both bundlers now use the standard Tailwind PostCSS adapter; the experimental loader was not reused in Webpack. System font stacks avoid Google Fonts build-time requests. Existing unrelated dependency changes were preserved.

## Code organization

Routes in `src/app` compose feature sections. Repeated headers, sliders, selectors and tables live in `src/components/ui`; explorer, home, insights and methodology components stay in their feature folders. `AppShell` renders on the server, with small client components for active navigation.

- `src/hooks`: asynchronous metadata loading and retry state.
- `src/lib`: typed radar configuration, pure metadata validation, formatting and swipe geometry.
- `src/content`: reusable presentation copy and source lists.
- `src/styles`: shared shell, explorer and page styles; explicit classes replace layout-dependent selectors.
- `processing/scripts`: named analysis steps and a shared bounded NASA catalog client. Scientific outputs are unchanged by the refactor.

Use `npm run format` to format frontend code and `npm run format:check` to check it. Keep map initialization in the client-only map boundary; controls should not recreate the map.

## Data actually used

| Input | Supplied observation date | Description |
| --- | --- | --- |
| `data/raw/hhhh_20261006.tif` | 2026-10-06 | NISAR L2 GCOV Frequency A HHHH power export |
| `data/raw/hhhh_20261030.tif` | 2026-10-30 | NISAR L2 GCOV Frequency A HHHH power export |
| `data/raw/aoi_tanguar_haor.geojson` | Not temporal | User-supplied analysis rectangle, not the surveyed wetland boundary |

Both rasters are 2641 × 2641, EPSG:4326, north-up, with southwest [25.0, 90.95] and northeast [25.25, 91.2]. Geographic coordinates are read from the files/metadata, not assumed by the map. Dates are supplied by the owner and filenames; exact acquisition timestamps and parent granule identifiers are not embedded in the exports. Product tags identify NISAR L2 GCOV and the dimensionless HHHH band.

The original TIFFs, `processing/scripts/prepare_radar.py`, legacy `public/data/*.png`, and legacy metadata remain intact. The legacy script is retained for compatibility but regenerates its original PNGs if explicitly run; the new pipeline is the recommended entry point.

## Reproduce the processing

```bash
python3 -m venv .venv
.venv/bin/pip install -r processing/requirements.txt
.venv/bin/python processing/scripts/analyze_radar.py
.venv/bin/python -m unittest discover -s processing/tests -v
```

`processing/observations.json` records source paths, supplied dates and unresolved provenance. The pipeline runs offline and never reads credentials. It:

1. Verifies CRS, grid alignment, north-up orientation, and GCOV HHHH source tags.
2. Combines raster NoData masks with finite, strictly positive power checks.
3. Computes `dB = 10 × log10(power)` and `delta_dB = after_dB − before_dB`.
4. Uses a common valid-paired population for comparisons and a shared 2nd–98th percentile display stretch.
5. Computes descriptive statistics, a complete histogram and exploratory ±3 dB signal categories at full source resolution.
6. Writes separate intensity, continuous difference and paired-valid outputs. Areas use equal-area EPSG:6933, never geographic degrees as square metres.
7. Creates compact Web Mercator display previews: bilinear intensity resampling and nearest-neighbor categories/validity; lossless WebP for change colors. These previews do not enter the statistics.

Outputs:

| Output | Purpose |
| --- | --- |
| `data/derived/before_db.tif`, `after_db.tif` | Full-grid dB intensity; each observation's valid samples |
| `data/derived/delta_db.tif` | Full-grid continuous difference on paired-valid samples |
| `data/derived/paired_valid_mask.tif` | 0 = invalid pair, 1 = valid pair; 255 reserved for NoData |
| `data/derived/audit.json` | Local copy of the report |
| `public/data/analysis.json` | Computed statistics, source hashes, QC, preview manifest and methods |
| `public/data/display/*-<hash>.webp` | Three small, versioned browser overlays |
| `public/data/study-area.geojson` | Copy of the supplied analysis rectangle |

Current display assets total **1,773,140 bytes** (~1.77 MB), compared with ~29.5 MB for the original PNGs. Hash-named previews have immutable caching; JSON metadata is not given an immutable cache. The original full-resolution sources are preserved. When changing dates or source grids, update the manifest and legacy metadata consistently, regenerate the report, and rebuild. The explorer rejects mismatched bounds, dates or thresholds.

## Scientific interpretation

- Blue: `delta_dB < −3`; orange: `delta_dB > +3`.
- Transparent: not highlighted, including within-threshold change and invalid paired samples.
- The ±3 dB threshold is exploratory, **not a validated water-detection threshold**.
- HH-only return depends on roughness, moisture, vegetation, water and acquisition conditions. Smooth open water can have low return; flooded vegetation may have increased return.
- No extra speckle filtering is applied. Statistics use the supplied unfiltered exports and may include speckle and upstream resampling effects.
- Source grids match, but orbit, incidence angle, processing-release comparability and native quality masks are unverified/unavailable. Numeric coverage is not scientific confidence.
- No water area, flood area, expansion/recession, inferred long-term trend or classification accuracy is reported. There are only two displayed observations.

The generated report contains all exact values; the UI imports those values rather than hardcoding results. See [the data audit](docs/data-audit.md) for detailed decisions.

## Supplemental NASA discovery

```bash
.venv/bin/python processing/scripts/discover_nasa.py
# Optional; requires system GDAL Python bindings and supported local Earthdata auth:
python3 processing/scripts/probe_reference.py
```

Discovery is bounded to actual AOI bounds, 2026-10-01 through 2026-11-06, six collections and five returned samples per collection. It downloads metadata only. Results, candidate IDs, dates and public query URLs are in `public/data/discovery.json`.

Overlapping GCOV, DSWx-HLS, DSWx-S1 and HLS candidates were found. One near-date DSWx-HLS WTR asset per target date was probed through GDAL for a small study-area window. Neither access attempt yielded a usable raster; `public/data/reference-probe.json` records the outcome. **No supplemental raster is integrated and no water validation is claimed.** Full-tile mosaicking, quality/cloud masks, temporal suitability, attribution and independent evaluation remain necessary. JPL lists DSWx-NI as under development; operational availability is not assumed.

The scripts do not display or read credential file contents. GDAL uses its supported authentication handling. `.aws`, `.netrc`, `.env*`, the virtual environment and local analytic outputs are ignored; deployment ignores raw/local processing files as well. Never add passwords or tokens to reports or commits.

## Validation

Focused checks cover power-to-dB conversion, invalid samples, geospatial mismatch rejection, equal-area calculations, source-to-result consistency, category/histogram accounting, change palette integrity and swipe clipping under pan/zoom.

```bash
npm run lint
npx tsc --noEmit
npm test
.venv/bin/python -m unittest discover -s processing/tests -v
npm run build
npm start -- --port 3001
# In another terminal:
node tests/http-smoke.mjs http://localhost:3001
```

The HTTP smoke check verifies all four routes, navigation markup, source-derived displayed values, local JSON, exact preview bytes/content hashes, cache headers, missing-resource 404s and Leaflet SSR isolation. This does not substitute for browser interaction testing.

Manual browser checklist: navigate all routes; pan, zoom and fit; switch every view/date; move the swipe range to 0/50/100 with mouse and keyboard; adjust opacity; resize to mobile; check the console for hydration/map errors; block a preview/metadata request and retry. The managed Browser connection was unavailable during implementation, so visual layout, pointer interactions and accessibility in a real browser still need that pass.

## Deploy

All four routes are statically prerendered by Next.js; no application secrets are needed. On Vercel, import this repository/branch as a Next.js project using Node 24, install with `npm ci`, and build with `npm run build`. Keep the default Next.js output settings. Generated JSON and WebP assets must be included in source control when you choose to commit; Python is not needed at deploy time. `.vercelignore` excludes original/local analytic rasters and authentication files from a local CLI upload.

Local production preview:

```bash
npm run build
npm start
```

No deployment, commit, push, merge or pull request is performed automatically. A live deployment and browser demo check remain delivery steps.

## Credits and sources

Data: **NASA/ISRO NISAR**; distribution documentation: **NASA ASF DAAC**. EarthPulse is an independent hackathon submission, not an official NASA service.

- [NISAR GCOV product guide](https://nisar-docs.asf.alaska.edu/gcov/)
- [NISAR amplitude and backscatter](https://nisar-docs.asf.alaska.edu/amplitude/)
- [ASF data search](https://search.asf.alaska.edu/)
- [NASA Earthdata](https://www.earthdata.nasa.gov/)
- [JPL OPERA DSWx suite](https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/)
- [PO.DAAC DSWx-HLS](https://podaac.jpl.nasa.gov/dataset/OPERA_L3_DSWX-HLS_V1)
- [Ramsar Tanguar Haor information](https://rsis.ramsar.org/RISapp/files/RISrep/BD1031RIS.pdf)

See the [three-minute judge walkthrough](docs/demo.md).
