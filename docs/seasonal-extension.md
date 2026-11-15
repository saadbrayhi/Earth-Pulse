# Seasonal Dynamics extension

## Delivery state

The existing `/explore` page now includes Radar Change / Seasonal Dynamics modes, a
Change Detective Matrix, a January–December observation calendar, a sourced impact
section and a five-chapter guided story. All six themes and the October radar pair
remain available. No additional route, dependency, account or database was introduced.

**The seasonal water comparison is unavailable, not completed with invented values.**
Catalog records were retrieved, but bounded GDAL/Earthdata raster-access attempts did
not yield usable classified pixels. No new satellite rasters were downloaded successfully
or integrated; no seasonal dates are selected for analysis, no water areas are reported,
and no local classification-validation accuracy is claimed.

## Archive evidence

Actual geographic bounds come from the generated radar report. The bounded search
checked January–February 2026 (dry candidates) and June–September 2026 (wet candidates),
with up to five granule records per collection/window. These are candidate calendar
windows, not verified hydrological states. Counts below are catalog hits, not unique
acquisition dates, full-region coverage or compatible pairs.

| Collection | Dry hits | Wet hits |
| --- | ---: | ---: |
| NISAR_L2_GCOV_V1 | 0 | 0 |
| NISAR_L2_GCOV_PROVISIONAL_V1 | 0 | 24 |
| NISAR_L2_GCOV_BETA_V1 | 0 | 0 |
| OPERA_L3_DSWX-HLS_V1 | 245 | 273 |
| OPERA_L3_DSWX-S1_V1 | 122 | 114 |

`public/data/seasonal-discovery.json` records query URLs, check time, sample product IDs,
acquisition timestamps, footprint boxes and candidate asset URLs. No unprocessed record
has a map layer. A missing calendar record means no verified record in this bounded
registry, not no satellite acquisition.

Two DSWx-HLS WTR study-window candidates were probed using GDAL's existing netrc and
cookie support. Their acquisition dates are 2026-01-01 and 2026-06-02. Neither produced
a usable raster, including after adding cookie handling. They are **access probes, not
selected seasonal observations**. Individual catalog tiles may cover only part of the
rectangle. The full product IDs and access results are in `public/data/seasonal-access.json`.
No credential contents, redirects, tokens or raw GDAL error payloads are logged.

## Scientific contracts

- The October 6/30 pair remains an exploratory after-minus-before dB comparison. Its
  grid and counts are verified; parent granule IDs, exact timestamps, orbit, incidence
  and processing-release comparability remain unresolved.
- Only registered, processed comparisons can be opened. Catalog-only, identical,
  unsupported reverse-order and mixed-method pairs cannot produce inferred differences.
- Four new lossless radar masks highlight decreases, within-threshold pixels, increases
  and invalid pairs. Their counts are checked against the unchanged radar report.
- The seasonal pipeline currently supports one explicitly documented dry/wet DSWx-HLS
  WTR pair of the same processing version. Acquisition date/version must match the
  product identifier. Different sensors/methods or composites require an explicit
  harmonization/aggregation extension; they are not silently accepted.
- WTR classes 1 and 2 form the water-classified pixel footprint; class 0 is non-water.
  Snow, cloud/shadow, ocean-mask, fill and invalid samples are unknown. Counting partial
  water pixels does not estimate fractional water area or water beneath vegetation.
- Categorical masks are resampled with nearest neighbor on a 30 m EPSG:6933 equal-area
  grid, restricted by cell centres to the supplied rectangular region. Transition areas
  and percentages use the common valid mask; excluded coverage is reported separately.
- Dry water = both dates + dry-only; wet water = both dates + wet-only. Net wet-minus-dry
  = wet-only minus dry-only. Four valid transition cells sum to the compared area.
- Water on both selected dates is not permanent/year-round water. A seasonal difference
  is not an unusual flood. Classification is explicitly distinct from independent validation.
- The supplied analysis rectangle is not the official Ramsar boundary. All area reporting
  refers to the documented comparison footprint, not the whole designated wetland.

## Reproduce

```bash
# Existing environment: processing/requirements.txt (no new Python dependency)
.venv/bin/python processing/scripts/discover_seasons.py
# Optional access probe: requires system GDAL and existing supported Earthdata auth
python3 processing/scripts/acquire_seasonal.py
# Offline: prepares the real four-category radar masks from existing derived rasters
.venv/bin/python processing/scripts/prepare_radar_categories.py
# Offline: selected manifest, or truthful unavailable output when no inputs exist
.venv/bin/python processing/scripts/analyze_seasonal.py
.venv/bin/python -m unittest discover -s processing/tests -v
```

To integrate an acquired pair, populate `processing/seasonal-inputs.json` with exactly
one record per season. Each record needs `id`, `date`, `season`, `mission`, `productId`,
`productType` (`DSWx-HLS-WTR-v1`), `processingVersion`, `path` and `sourceUrl`.
Use real cropped/mosaicked WTR files with preserved CRS, transform, class values and
NoData; never substitute screenshots. Assess footprint and quality before choosing a
pair. Regenerate `seasonal.json`, review coverage and limitations, then rebuild.
The checked-in manifest intentionally contains no pretend observations.

The selected inputs are hashed. Output observations, lossless previews, common-mask
metrics and transition masks are written separately; originals are preserved. The
frontend enables classified metrics only after parsing a complete report. Independent
reference validation remains a separate scientific step, with no borrowed accuracy.

## Sources and impact attribution

Shared records are in `src/data/impact.ts`. The impact section separates historical
research/reporting, environmental context and the future roadmap from EarthPulse data.

- Mondal et al., *Effects of 2017 Early Flash Flooding on Agriculture in Haor Areas of
  Sunamganj*, DOI 10.3329/jesnr.v12i1-2.52007, journal volume dated 2019 / online 2021:
  149,224 ha affected Boro cultivation, 393,855 metric tonnes damaged rice, 315,084
  affected farmers and 44,445 affected fishermen. Scope: Sunamganj haor areas.
  https://www.banglajol.info/index.php/JESNR/article/view/52007/36873
- The Daily Star, 7 May 2026, agriculture-ministry reporting for 26 April–4 May across
  seven haor districts: 49,073 ha cropland, approximately 213,000 tonnes Boro rice and
  236,000 affected farmers. This is the dated contemporaneous estimate, not a final
  inventory. The article does not publish a complete estimation protocol.
  https://www.thedailystar.net/business/news/haor-floods-wipe-out-tk-1047-crore-crops-agri-ministry-4170151
- CPD's June 2026 presentation, slide 68, presents a different model/assessment and
  revised central rice-loss estimate of 339,449 tonnes. It is linked separately;
  incompatible estimates are not combined.
  https://cpd.org.bd/resources/2026/06/CPD_IRBD_3rd-Reading-FY26_Presentation.pdf
- Ramsar's 6 September 2000 announcement reports 9,500 ha, at least 135 fish species
  and 208 bird species. These are dated designation-context figures, not today's census
  or the area of the satellite analysis rectangle.
  https://www.ramsar.org/fr/news/bangladesh-designates-its-2nd-ramsar-site
- Uddin, Matin & Meyer (2019), DOI 10.3390/rs11131581: the cited 96.44% overall accuracy
  belongs to that Sentinel-1 flood-map study. It is never presented as EarthPulse accuracy.
  https://www.mdpi.com/2072-4292/11/13/1581
- DSWx-HLS class policy follows the NASA product documentation.
  https://podaac.jpl.nasa.gov/dataset/OPERA_L3_DSWX-HLS_V1

The source claims were checked against accessible full text or indexed source text;
some publishers return automated-access 403 responses. Browser QA does not certify
continuous availability of those external websites. October scenes are never presented
as observing the earlier disasters, and losses are not assigned to individual pixels.

## Interface and validation

Observation and comparison registries live in `src/data/observations.ts`. Discovery,
classification state and radar mask manifests enter through `src/data/seasons.ts`;
components never import generated JSON directly. Reusable map-image overlays preserve
one Leaflet map during mode/layer changes. The divider supports pointer dragging,
keyboard controls and the existing range input. Story navigation is a nonmodal panel
with Previous, Next, Skip and Close controls.

```bash
npm run lint
npx tsc --noEmit
npm test
npm run format:check
npm run build
npm start -- --hostname 127.0.0.1 --port 3127
# Another terminal:
node tests/http-smoke.mjs http://127.0.0.1:3127
node tests/browser-smoke.mjs http://127.0.0.1:3127
```

The browser check uses isolated headless Chrome and a fresh temporary profile; set
`CHROME_BIN` if Chrome is elsewhere. It never accesses personal browser profiles.
Screenshots are written in a temporary directory printed by the check. The managed
Browser connection was unavailable; an isolated local browser is the QA fallback.

Remaining scientific blocker: acquire usable, compatible classified observations,
verify their footprint/quality and hydrological timing, and perform independent local
validation. No operational warning or classified seasonal flood-detection service is
claimed. No commit, push or deployment is performed.

## File inventory

Existing files modified:

- `README.md`
- `docs/demo.md`
- `docs/validation.md`
- `package.json`
- `src/app/explore/page.tsx`
- `src/app/layout.tsx`
- `src/components/explore/explore-dashboard.tsx`
- `src/components/explore/radar-comparison.tsx`
- `src/components/explore/radar-map.tsx`
- `src/components/explore/radar-overlay.tsx`
- `src/components/explore/study-details.tsx`
- `src/components/methodology/methodology-content.tsx`
- `src/content/methodology.ts`
- `src/content/pages.ts`
- `src/data/README.md`
- `src/data/files.ts`
- `tests/http-smoke.mjs`

New files created:

- `docs/seasonal-extension.md`
- `processing/scripts/acquire_seasonal.py`
- `processing/scripts/analyze_seasonal.py`
- `processing/scripts/discover_seasons.py`
- `processing/scripts/prepare_radar_categories.py`
- `processing/scripts/seasonal_core.py`
- `processing/seasonal-inputs.json`
- `processing/tests/test_seasonal.py`
- `public/data/display/radar-decreased-0b321d9b947f.webp`
- `public/data/display/radar-increased-e18d6c226b27.webp`
- `public/data/display/radar-invalid-04d565152330.webp`
- `public/data/display/radar-withinThreshold-053e0a37f33b.webp`
- `public/data/radar-categories.json`
- `public/data/seasonal-access.json`
- `public/data/seasonal-discovery.json`
- `public/data/seasonal.json`
- `src/components/explore/change-detective.tsx`
- `src/components/explore/guided-story.tsx`
- `src/components/explore/impact-section.tsx`
- `src/components/explore/map-image-overlay.tsx`
- `src/components/explore/observation-calendar.tsx`
- `src/components/explore/radar-change-matrix.tsx`
- `src/components/explore/seasonal-panel.tsx`
- `src/components/explore/water-transition-matrix.tsx`
- `src/content/story.ts`
- `src/data/impact.ts`
- `src/data/observations.ts`
- `src/data/seasons.ts`
- `src/lib/comparison.ts`
- `src/lib/observation-types.ts`
- `src/lib/seasonal-report.ts`
- `src/styles/seasonal.css`
- `tests/browser-smoke.mjs`
- `tests/explorer-data.test.mjs`
