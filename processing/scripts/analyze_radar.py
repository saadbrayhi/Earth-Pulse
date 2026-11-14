"""Reproducible full-grid analysis; immutable sources, separate small display assets.

Run: .venv/bin/python processing/scripts/analyze_radar.py
No network, credentials, water classifier, or speckle filtering is used.
"""
from pathlib import Path
import hashlib
import json
import math

import numpy as np
import rasterio
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject, transform, transform_bounds
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
THRESHOLD = 3.0


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def power_to_db(power, mask):
    valid = np.asarray(mask, dtype=bool) & np.isfinite(power) & (power > 0)
    db = np.full(power.shape, np.nan, dtype=np.float32)
    np.log10(power, out=db, where=valid)
    db *= 10
    return db, valid


def check_alignment(first, second):
    if first.crs != second.crs or first.shape != second.shape or not first.transform.almost_equals(second.transform, precision=1e-12):
        raise ValueError("Observations must share a CRS, shape, and affine grid; resample explicitly before comparison.")
    if first.crs != rasterio.crs.CRS.from_epsg(4326):
        raise ValueError("This pipeline expects the supplied EPSG:4326 exports.")
    if first.transform.b != 0 or first.transform.d != 0 or first.transform.a <= 0 or first.transform.e >= 0:
        raise ValueError("Expected north-up, unrotated grid.")


def check_measurement(ds):
    tags = ds.tags(1)
    if ds.count != 1 or tags.get("NETCDF_VARNAME") != "HHHH" or tags.get("units") != "1" or "GCOV" not in ds.tags().get("NC_GLOBAL#title", ""):
        raise ValueError("Expected a single-band, dimensionless NISAR GCOV HHHH power export with source band tags.")


def summarize(values):
    if not len(values):
        raise ValueError("No valid observations to summarize.")
    p = np.percentile(values, [2, 25, 50, 75, 98]).tolist()
    return dict(count=int(values.size), minDb=float(values.min()), maxDb=float(values.max()),
                meanDb=float(np.mean(values, dtype=np.float64)), stdDb=float(np.std(values, dtype=np.float64)),
                p02Db=p[0], p25Db=p[1], medianDb=p[2], p75Db=p[3], p98Db=p[4])


def row_areas_km2(bounds, height, width):
    """Equal-area EPSG:6933 rectangles, per row, for north-up geographic grids."""
    latitudes = np.linspace(bounds.top, bounds.bottom, height + 1)
    xs, ys = transform("EPSG:4326", "EPSG:6933", [bounds.left] * len(latitudes), latitudes.tolist())
    right_x, _ = transform("EPSG:4326", "EPSG:6933", [bounds.right], [bounds.top])
    return np.abs(np.diff(ys)) * abs(right_x[0] - xs[0]) / width / 1e6


def write_raster(path, data, profile, nodata):
    profile = {**profile, "driver": "GTiff", "count": 1, "dtype": str(data.dtype), "nodata": nodata,
               "compress": "deflate", "tiled": True, "blockxsize": 256, "blockysize": 256}
    with rasterio.open(path, "w", **profile) as dst:
        dst.write(data, 1)


def make_preview(db, paired, bounds, profile, stretch, change=False):
    # Leaflet projects to Web Mercator. Reproject the preview, rather than
    # stretching a latitude-linear PNG onto a Mercator rectangle.
    west, south, east, north = transform_bounds(profile["crs"], "EPSG:3857", *bounds)
    ratio = (east - west) / (north - south)
    width, height = (1536, round(1536 / ratio)) if ratio >= 1 else (round(1536 * ratio), 1536)
    target_grid = from_bounds(west, south, east, north, width, height)
    kwargs = dict(src_transform=profile["transform"], src_crs=profile["crs"],
                  dst_transform=target_grid, dst_crs="EPSG:3857")
    mask = np.zeros((height, width), dtype=np.uint8)
    reproject(paired.astype("uint8"), mask, resampling=Resampling.nearest, **kwargs)
    if change:
        classes = np.zeros(db.shape, dtype=np.uint8)
        classes[paired & (db < -THRESHOLD)] = 1
        classes[paired & (db > THRESHOLD)] = 2
        target = np.zeros((height, width), dtype=np.uint8)
        reproject(classes, target, resampling=Resampling.nearest, **kwargs)
        rgba = np.zeros((height, width, 4), dtype=np.uint8)
        rgba[(target == 1) & (mask == 1)] = [40, 110, 220, 190]
        rgba[(target == 2) & (mask == 1)] = [235, 105, 55, 190]
    else:
        target = np.full((height, width), np.nan, dtype=np.float32)
        reproject(db, target, src_nodata=np.nan, dst_nodata=np.nan, resampling=Resampling.bilinear, **kwargs)
        grey = (np.clip(np.nan_to_num((target - stretch[0]) / (stretch[1] - stretch[0])), 0, 1) * 255).astype("uint8")
        rgba = np.stack([grey, grey, grey, ((mask == 1) & np.isfinite(target)).astype("uint8") * 255], axis=-1)
    return Image.fromarray(rgba)


def main():
    sources = json.loads((ROOT / "processing/observations.json").read_text())
    records = sources["observations"]
    out = ROOT / "public/data"
    display = out / "display"
    derived = ROOT / "data/derived"
    display.mkdir(parents=True, exist_ok=True)
    derived.mkdir(parents=True, exist_ok=True)
    with rasterio.open(ROOT / records[0]["path"]) as first, rasterio.open(ROOT / records[1]["path"]) as second:
        check_alignment(first, second)
        check_measurement(first)
        check_measurement(second)
        before, valid_b = power_to_db(first.read(1), first.read_masks(1) > 0)
        after, valid_a = power_to_db(second.read(1), second.read_masks(1) > 0)
        profile, bounds = first.profile, first.bounds
        audits = []
        for ds, record, valid in [(first, records[0], valid_b), (second, records[1], valid_a)]:
            audits.append({**record, "sha256": sha256(ROOT / record["path"]), "crs": str(ds.crs),
                "width": ds.width, "height": ds.height, "resolutionDegrees": list(ds.res),
                "transform": list(ds.transform)[:6], "nodata": "NaN" if ds.nodata is not None and math.isnan(ds.nodata) else ds.nodata,
                "validPixels": int(valid.sum()), "productTitle": ds.tags().get("NC_GLOBAL#title"),
                "measurementDescription": ds.tags(1).get("description"), "units": ds.tags(1).get("units"),
                "acquisitionTimestamp": None, "relativeOrbit": None, "qualityMaskAvailable": False})
    paired = valid_b & valid_a
    if not paired.any():
        raise ValueError("No positive, finite paired observations.")
    delta = np.full(before.shape, np.nan, dtype=np.float32)
    np.subtract(after, before, out=delta, where=paired)
    values = delta[paired]
    stretch = np.percentile(np.concatenate([before[paired], after[paired]]), [2, 98]).tolist()
    if stretch[1] <= stretch[0]:
        raise ValueError("Cannot display a constant-value pair with percentile stretching.")
    areas = row_areas_km2(bounds, profile["height"], profile["width"])
    masks = {"decreased": paired & (delta < -THRESHOLD), "withinThreshold": paired & (np.abs(delta) <= THRESHOLD), "increased": paired & (delta > THRESHOLD)}
    categories = []
    for name, mask in masks.items():
        count = int(mask.sum())
        categories.append({"key": name, "pixels": count, "percentValid": count / int(paired.sum()) * 100,
                           "areaKm2": float(np.dot(mask.sum(axis=1), areas))})
    # Explicit tails make histogram counts sum exactly to the paired population.
    edges = np.r_[-np.inf, np.arange(-15, 16, 1), np.inf]
    counts, _ = np.histogram(values, bins=edges)
    histogram = [{"label": "< −15" if i == 0 else "≥ 15" if i == len(counts)-1 else f"{int(edges[i])} to {int(edges[i+1])}",
                  "lowerDb": None if not np.isfinite(edges[i]) else float(edges[i]),
                  "upperDb": None if not np.isfinite(edges[i+1]) else float(edges[i+1]), "pixels": int(count)} for i, count in enumerate(counts)]
    for name, data in [("before_db", before), ("after_db", after), ("delta_db", delta)]:
        write_raster(derived / f"{name}.tif", data, profile, np.nan)
    # 0 and 1 are both meaningful; 255 is reserved for NoData.
    write_raster(derived / "paired_valid_mask.tif", paired.astype("uint8"), profile, 255)
    assets = {}
    for name, data in [("before", before), ("after", after), ("change", delta)]:
        image = make_preview(data, paired, bounds, profile, stretch, change=name == "change")
        temporary = display / f"{name}.webp"
        image.save(temporary, "WEBP", lossless=name == "change", quality=85, method=6)
        digest = sha256(temporary)[:12]
        final = display / f"{name}-{digest}.webp"
        temporary.replace(final)
        assets[name] = {"url": "/data/display/" + final.name, "bytes": final.stat().st_size, "width": image.width, "height": image.height,
                        "projection": "EPSG:3857", "encoding": "lossless WebP" if name == "change" else "WebP quality 85"}
    # This rectangle is a user-supplied analysis region, NOT a surveyed wetland boundary.
    (out / "study-area.geojson").write_bytes((ROOT / "data/raw/aoi_tanguar_haor.geojson").read_bytes())
    report = {"schemaVersion": 1, "location": sources["location"], "beforeDate": records[0]["date"], "afterDate": records[1]["date"],
        "bounds": [[bounds.bottom, bounds.left], [bounds.top, bounds.right]], "product": sources["product"], "frequency": "A", "polarization": "HH", "measurement": "HHHH",
        "sources": audits, "dateEvidence": sources["dateEvidence"], "assets": assets,
        "studyArea": json.loads((ROOT / "data/raw/aoi_tanguar_haor.geojson").read_text()),
        "processing": {"formula": "10 × log10(after power) − 10 × log10(before power)", "thresholdDb": THRESHOLD,
            "stretchPercentiles": [2, 98], "stretchDb": stretch, "speckleFilter": "None; statistics use unfiltered full-resolution exported pixels",
            "previewResampling": "Grayscale: bilinear in dB; categorical change and validity: nearest-neighbor; previews reprojected to EPSG:3857",
            "areaCrs": "EPSG:6933", "statisticsGrid": "Original exported EPSG:4326 grid; display compression never enters the analysis"},
        "quality": {"totalPixels": int(paired.size), "pairedValidPixels": int(paired.sum()), "invalidPairedPixels": int((~paired).sum()),
            "pairedValidPercent": float(paired.mean() * 100), "alignmentVerified": True,
            "aoiAreaKm2": float(areas.sum() * profile["width"]), "pairedAreaKm2": float(np.dot(paired.sum(axis=1), areas)),
            "orbitComparability": "Unverified: orbit, incidence angle and acquisition mode metadata are absent from the exports",
            "waterValidation": "Not performed; no independent co-temporal water reference integrated"},
        "before": summarize(before[paired]), "after": summarize(after[paired]), "delta": summarize(values),
        "categories": categories, "histogram": histogram,
        "limitations": ["Exploratory ±3 dB backscatter threshold, not a water detector", "No native NISAR layover/shadow quality mask in these exports",
            "HH-only observations cannot uniquely separate water, roughness, vegetation and moisture", "Dates supplied by the owner; parent granule IDs and timestamps unavailable",
            "Analysis rectangle includes surrounding land; it is not an authoritative wetland boundary", "Spatially correlated pixels do not provide independent statistical confidence"]}
    (out / "analysis.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    (derived / "audit.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    print(json.dumps({"pairedValidPixels": report["quality"]["pairedValidPixels"], "deltaMeanDb": report["delta"]["meanDb"], "assets": assets}, indent=2))


if __name__ == "__main__":
    main()
