# Data audit and scientific decisions

## Inputs actually analyzed

- `data/raw/hhhh_20261006.tif`
- `data/raw/hhhh_20261030.tif`
- `data/raw/aoi_tanguar_haor.geojson` (user-supplied rectangular analysis region)
- `processing/observations.json` (supplied date/product context)

The original TIFFs and legacy PNGs are preserved. No downloaded supplemental raster is used. Input SHA-256 digests, grid transforms, positive/finite counts, product descriptions and all calculated results are in `public/data/analysis.json`. The frontend imports this generated JSON; it does not contain manually entered scientific results.

## Verified

Both TIFFs have one float32 HHHH band, identical 2641 × 2641 north-up EPSG:4326 grids, and bounds southwest [25.0, 90.95], northeast [25.25, 91.2]. Both designate NaN as NoData. Each export retains NASA JPL NISAR L2 GCOV product identification and dimensionless HHHH intensity metadata. The pixel spacing is about 0.0000946611132 degrees in both axes. Parent UTM zone 46N metadata remains as historical HDF5 tags; the actual exported raster CRS controls analysis.

There are 6,974,728 valid positive finite samples before, 6,974,721 after, and 6,974,711 paired samples. Every statistic and category uses that common population. Four initial processing tests were extended to six, including a direct recomputation from original power values, count/area accounting, and lossless change-color verification.

## Not independently verified

The supplied dates are encoded in filenames and the project manifest. Exact acquisition timestamps, parent granule identifiers, relative orbit, incidence angle, acquisition mode and release are not embedded in the exported TIFFs. An equal grid is necessary but not sufficient to establish radiometric comparability. The native NISAR ensemble/layover/shadow mask is absent. Numeric validity is not equivalent to instrument quality or classification confidence.

No additional speckle filtering is applied. The existing exports are analyzed as supplied; their upstream resampling history is not fully recoverable. Small changes may include speckle and resampling effects. Pixelwise statistics are descriptive, not independent observations for confidence intervals.

## Interpretation decision

Retain radar backscatter differences as the primary result. Smooth open water may produce low HH return, but wind, roughness, vegetation, moisture and geometry can produce overlapping responses. The exploratory ±3 dB rule is a signal highlight, not a water classifier. No water area, water expansion/recession, flood extent or classification accuracy is defensible from this pair alone. Historical water occurrence and the Ramsar boundary are contextual sources, not co-temporal validation.

## Supplemental investigation

`public/data/discovery.json` records bounded CMR queries for actual AOI bounds and 2026-10-01 through 2026-11-06, with a five-record sample cap per collection. Returned hits: validated GCOV 4; provisional GCOV 5; beta GCOV 0; DSWx-HLS 131; DSWx-S1 53; Landsat HLS 30. Catalog hits include overlapping tiles and releases, not necessarily unique usable dates or complete study coverage. These candidates have not been linked to the local exports.

`public/data/reference-probe.json` records one DSWx-HLS candidate within ±1 day of each target date. GDAL asset access did not yield a usable raster. Errors are recorded by type without URLs containing tokens or credential contents. This is an access/validation blocker, not a claim that the datasets do not exist. No multi-gigabyte HDF5 downloads were attempted.

Before use, references need all intersecting tiles, exact acquisition times, quality/cloud/shadow/snow masks, class definitions, coverage assessment, appropriate reprojection and license/citation review. DSWx-HLS and DSWx-S1 are complementary but not harmonized products; SAR-derived reference errors may correlate with a SAR classifier. JPL's [DSWx suite page](https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/) lists DSWx-NI as under development, so no operational DSWx-NI availability is assumed.

## Official sources consulted

Historical alternatives considered: [NASA MOD44W Collection 6.1](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MOD44W) provides an annual 250 m land/water mask, too coarse and temporally aggregated to validate this observation pair. [JRC Global Surface Water](https://global-surface-water.appspot.com/download) offers 30 m historical occurrence through 2024. It can provide context, not October 2026 truth; published use requires EC JRC/Google attribution and the documented dataset/paper citation. Neither was downloaded or used for measurement.

- [ASF GCOV product guide](https://nisar-docs.asf.alaska.edu/gcov/)
- [ASF amplitude interpretation](https://nisar-docs.asf.alaska.edu/amplitude/)
- [ASF Earthdata catalog names](https://nisar-docs.asf.alaska.edu/earthdata-search/)
- [NASA OPERA DSWx suite](https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/)
- [PO.DAAC DSWx-HLS](https://podaac.jpl.nasa.gov/dataset/OPERA_L3_DSWX-HLS_V1)
- [Ramsar Tanguar Haor context](https://rsis.ramsar.org/RISapp/files/RISrep/BD1031RIS.pdf)
