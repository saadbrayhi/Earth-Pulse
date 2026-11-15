# EarthPulse — a wetland's changing radar signal

EarthPulse is a NASA Space Apps 2026 project for **Dancing with the SARs**, on the **Water & Wetlands Monitoring** track. It makes two supplied NASA/ISRO NISAR observations over **Tanguar Haor, Bangladesh** inspectable through synchronized maps, measured statistics and transparent explanations.

**Status: deployed.** The original radar study compares **6 October 2026 → 30 October 2026**. Additional public NASA optical imagery provides context for selected dates across January–November 2026.

**Radar backscatter change is NOT validated flood extent.** EarthPulse demonstrates radar-change exploration, not operational flood detection or a validated water classifier.

## The experience

- `/`: public project homepage using an actual radar observation, with study context and an explorer action.
- `/explore`: original NISAR before/after/swipe/change views, public optical imagery, a shared observation calendar, compatible-pair selection, opacity and fit/zoom controls, study-region GeoJSON, legends and recoverable loading/error states.
- `/insights`: analysis of the selected data: original radar statistics and histogram, single-observation intensity statistics, or optical source information and limitations.
- `/about`: methods, provenance gaps, supplemental investigation, sources and scientific limitations.

The default interface uses light ivory, forest green and muted gold. Radar imagery retains a dark neutral canvas and its scientific blue/orange change colors. The palette is centralized in `src/styles/theme.css`; Tailwind utilities and charts use the same semantic variables. The core application requires no account, database, tile server, live NASA authentication, remote font or external AI API. The explanation panel is deterministic and grounded in the computed report.

## Observation modes and Change Detective

The explorer offers **Public imagery / Radar Change / Seasonal Dynamics**, a date registry/calendar,
compatible-pair selection, clickable radar masks, a cited 2017/2026 impact timeline and
**Explore the story**, a five-chapter guided demo. All existing themes remain available.

**Radar Change** restores the original NISAR pair. Use **Original NISAR study** to return
to 6–30 October from any explorer mode. Original NISAR records appear first among
observations on the same date; optical records retain their separate source identity.

**Public imagery** includes 20 downloaded NASA GIBS MODIS Terra optical browse images.
Selected catalog-only dates can display separately labeled, same-date optical context.
Use **Use NASA optical image** to choose optical records for a visual comparison.
These images may contain clouds and do not supply radar differences, water classifications
or water-area statistics. Not every calendar date has a usable image. See
[public imagery provenance](docs/public-imagery.md) for sources and reproduction.

**Seasonal water data is currently unavailable.** Real NASA catalog candidates were
found, but Earthdata raster-access probes yielded no usable classified pixels. The
interface reports this explicitly; no seasonal water area or validation accuracy is
fabricated. The reusable classification pipeline and transition matrix are ready for
an explicitly selected, quality-checked DSWx-HLS pair.

See [the extension report](docs/seasonal-extension.md) for discovered datasets, actual
access attempts, source-backed impact records, scientific contracts, reproduction and
browser-test commands. Re-run the seasonal processing and rebuild after selecting real
inputs; do not manually fill in metrics.

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

Open **https://earthpulse-nasa.vercel.app/**, or go directly to **https://earthpulse-nasa.vercel.app/explore** for the original radar study.

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm start
```

The production build uses Webpack and the standard Tailwind PostCSS adapter. System font stacks avoid build-time font downloads. Python is needed only to reproduce or extend the data processing, not to run the web application.

## Code organization

Routes in `src/app` compose feature sections. Repeated headers, sliders, selectors and tables live in `src/components/ui`; explorer, home, insights and methodology components stay in their feature folders. `AppShell` renders on the server, with small client components for active navigation.

- `src/hooks`: asynchronous metadata loading and retry state.
- `src/data`: shared project configuration, report-derived study facts, routes and source catalogs.
- `src/lib`: pure metadata validation, formatting, swipe geometry and theme preferences.
- `src/content`: reusable presentation copy and source lists.
- `src/styles`: shared shell, explorer and page styles; explicit classes replace layout-dependent selectors.
- `processing/scripts`: named analysis steps and a shared bounded NASA catalog client. Scientific outputs are unchanged by the refactor.

Use `npm run format` to format frontend code and `npm run format:check` to check it. Keep map initialization in the client-only map boundary; controls should not recreate the map.

## Linked Explore and Insights selections

Select observation A/B or open a date card in the explorer calendar. The selected data
appears in navigation and carries into Insights. Single-date views show that date's
paired-population intensity statistics; pair views show the supported comparison.
Catalog-only dates without optical context display an unavailable state. Where same-date
optical context exists, the interface identifies the displayed MODIS source and shows its
limitations rather than borrowing radar statistics.
Use **Change selected observations**, **Analyze selected pair** or **Reset selection**
on either page. **Reset selection** returns to the original NISAR pair. The URL preserves
the selection across reloads and shared links; the map, calendar, navigation and Insights
read that same selection.

See [selection and map lifecycle notes](docs/selection-and-map-lifecycle.md) for the
cached-navigation overlay fix and regression commands.

## Shared website data

`src/data` is the shared entry point for project identity, routes, file URLs, scientific source links and study facts. `study.ts` derives observation lists, product labels, category labels, thresholds and preview URLs from the generated `public/data/analysis.json`; components do not keep their own copies. `src/content` holds page metadata, stories, scientific notices and deterministic explanations. Supplemental reports are isolated from client map/chart imports.

See [the data organization guide](src/data/README.md) for where to make each kind of change. The legacy metadata request still guards the explorer against mismatched dates, location, bounds or thresholds. ESLint rejects direct generated-data imports outside `src/data`.

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
| `public/data/display/*-<hash>.webp` | Versioned radar previews, category masks and public optical imagery |
| `public/data/study-area.geojson` | Copy of the supplied analysis rectangle |

The three primary radar previews total **1,773,140 bytes** (~1.77 MB), compared with ~29.5 MB for the original PNGs. The 20 public optical images add **169,350 bytes**. Hash-named previews have immutable caching; JSON metadata is not given an immutable cache. The original full-resolution sources are preserved. When changing dates or source grids, update the manifest and legacy metadata consistently, regenerate the report, and rebuild. The explorer rejects mismatched bounds, dates or thresholds.

## Scientific interpretation

- Blue: `delta_dB < −3`; orange: `delta_dB > +3`.
- Transparent: not highlighted, including within-threshold change and invalid paired samples.
- The ±3 dB threshold is exploratory, **not a validated water-detection threshold**.
- HH-only return depends on roughness, moisture, vegetation, water and acquisition conditions. Smooth open water can have low return; flooded vegetation may have increased return.
- No extra speckle filtering is applied. Statistics use the supplied unfiltered exports and may include speckle and upstream resampling effects.
- Source grids match, but orbit, incidence angle, processing-release comparability and native quality masks are unverified/unavailable. Numeric coverage is not scientific confidence.
- No water area, flood area, expansion/recession, inferred long-term trend or classification accuracy is reported. Radar analysis uses only the two original observations; additional optical dates provide visual context.

The generated report contains all exact values; the UI imports those values rather than hardcoding results. See [the data audit](docs/data-audit.md) for detailed decisions.

## Supplemental NASA discovery

```bash
.venv/bin/python processing/scripts/discover_nasa.py
# Optional; requires system GDAL Python bindings and supported local Earthdata auth:
python3 processing/scripts/probe_reference.py
```

Discovery is bounded to actual AOI bounds, 2026-10-01 through 2026-11-06, six collections and five returned samples per collection. It downloads metadata only. Results, candidate IDs, dates and public query URLs are in `public/data/discovery.json`.

Overlapping GCOV, DSWx-HLS, DSWx-S1 and HLS candidates were found. One near-date DSWx-HLS WTR asset per target date was probed through GDAL for a small study-area window. Neither access attempt yielded a usable raster; `public/data/reference-probe.json` records the outcome. **No supplemental classified raster is integrated and no water validation is claimed.** Public MODIS optical browse images are integrated separately for visual context. Full-tile mosaicking, quality/cloud masks, temporal suitability, attribution and independent evaluation remain necessary before adding classification results.

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
node tests/workspace-browser.mjs http://localhost:3001
node tests/public-imagery-browser.mjs http://localhost:3001
node tests/browser-smoke.mjs http://localhost:3001
```

The HTTP smoke check verifies all four routes, navigation markup, source-derived displayed values, local JSON, exact preview bytes/content hashes, cache headers, missing-resource 404s and Leaflet SSR isolation. This does not substitute for browser interaction testing.

Browser regression scripts use isolated headless Chrome with a temporary profile; set `CHROME_BIN` if Chrome is installed elsewhere. Checks cover image loading, radar and optical selection, linked Insights, returning to the original NISAR pair, reload persistence and cached route navigation. The latest original-study regression completed without runtime errors. This does not constitute a complete accessibility, cross-browser or scientific validation audit.

## Deployment

EarthPulse is deployed. All four routes are statically prerendered by Next.js, and the core application requires no application secrets. For subsequent deployments, use Node 24, install with `npm ci`, and build with `npm run build`. Keep the hosting provider's standard Next.js output settings. Generated JSON and WebP assets must be included in the deployment; Python is not needed at deploy time. `.vercelignore` excludes original/local analytic rasters and authentication files from a local Vercel CLI upload.

Local production preview:

```bash
npm run build
npm start
```

After a deployment update, verify the original 6–30 October NISAR comparison and navigation to Insights. Regenerated scientific reports or imagery require a new application build to update shared imported data.

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
