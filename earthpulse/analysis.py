"""Water-change analysis of two NISAR GCOV scenes on a common grid, plus web export.

Steps:
  1. Speckle: Lee filter (5x5, or 7x7 when the pixels carry few looks), ENL from numberOfLooks.
  2. Water-like = dark HH AND HV near its noise floor; thresholds derived from the data (both dates pooled),
     with a documented fallback when the area holds too little water to estimate them.
  3. Classes: persistent / receded / new water-like, 3x3 majority clean-up, minimum mapping unit 0.25 ha.
  4. Statistics on the projected (UTM) grid; layers reprojected to Web Mercator for Leaflet.

Inputs `b` (before) and `a` (after) are dicts with, on the reference grid `ref`:
  HHHH, HVHV  float32 linear gamma0 power (NaN = no data)
  valid       bool mask
  enl         equivalent number of looks per pixel
  native_res  native pixel size (m)
  scene       {sceneName, sourceUrl, collection, bandwidth[list], polarizations, track, frame, direction}
  ident       identification group of the .h5 (zeroDopplerStartTime, absoluteOrbitNumber, ...)
  qa          {checks, passed, failed[]} from QA_SUMMARY.csv (may be {})
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image
from rasterio.warp import Resampling, calculate_default_transform, reproject, transform_bounds
from scipy.ndimage import label, median_filter, uniform_filter

WEB_CRS = "EPSG:3857"
DISPLAY_DB = (-25.0, -3.0)    # grey stretch for before/after images
CHANGE_DB_SIG = 3.0           # |change| >= this is "notable"
CHANGE_DB_SHOW = 1.5          # |change| below this is transparent in backscatter_change
CHANGE_DB_SAT = 8.0           # colour saturation for backscatter_change
MIN_PATCH_M2 = 2500           # minimum mapping unit for change patches (0.25 ha)
FALLBACK_HH_DB = -15.0        # used when the area has too little water to derive the HH threshold

CLASSES = [  # value, key, label, RGBA
    (1, "persistent", "Low backscatter on both dates (likely persistent open water)", (37, 99, 235, 150)),
    (2, "receded", "Low backscatter only before (likely water receded)", (234, 138, 30, 220)),
    (3, "new", "Low backscatter only after (newly water-like)", (139, 92, 246, 220)),
]

SOURCES = [
    {"label": "NISAR L2 GCOV (ASF DAAC)", "url": "https://nisar-docs.asf.alaska.edu/gcov/"},
    {"label": "Product DOI 10.5067/NIL2GCOV-V1", "url": "https://doi.org/10.5067/NIL2GCOV-V1"},
    {"label": "ASF Vertex data search", "url": "https://search.asf.alaska.edu/"},
    {"label": "NASA Space Apps 2026: Dancing with the SARs",
     "url": "https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/"},
]


# --------------------------------------------------------------------------- grid helpers
def to_ref(arr: np.ndarray, src_transform, src_crs, ref: dict, resampling=Resampling.average, nodata=np.nan):
    """Resample an array onto the reference grid (averaging in linear units by default)."""
    dst = np.full(ref["shape"], nodata, dtype=arr.dtype)
    reproject(arr, dst, src_transform=src_transform, src_crs=src_crs, src_nodata=nodata,
              dst_transform=ref["transform"], dst_crs=ref["crs"], dst_nodata=nodata, resampling=resampling)
    return dst


def valid_on_ref(mask: np.ndarray, src_transform, src_crs, ref: dict) -> np.ndarray:
    """GCOV mask (0 invalid, 1..254 valid subswath, 255 outside) -> bool on the reference grid."""
    v = ((mask > 0) & (mask < 255)).astype("float32")
    dst = np.zeros(ref["shape"], dtype="float32")
    reproject(v, dst, src_transform=src_transform, src_crs=src_crs,
              dst_transform=ref["transform"], dst_crs=ref["crs"], resampling=Resampling.average)
    return dst > 0.999  # every contributing native pixel must be valid


# --------------------------------------------------------------------------- science
def lee_filter(img: np.ndarray, enl: float, size: int = 5) -> np.ndarray:
    """Classic Lee speckle filter on linear power. NaNs are ignored in the local statistics."""
    finite = np.isfinite(img)
    x = np.where(finite, img, 0.0).astype("float64")
    w = uniform_filter(finite.astype("float64"), size)
    with np.errstate(invalid="ignore", divide="ignore"):
        mean = uniform_filter(x, size) / w
        sq = uniform_filter(x * x, size) / w
        var = np.maximum(sq - mean ** 2, 0)
        cu2 = 1.0 / max(enl, 1.0)
        var_x = np.maximum((var - mean ** 2 * cu2) / (1 + cu2), 0)
        k = var_x / np.maximum(var_x + mean ** 2 * cu2, 1e-12)
        out = mean + k * (x - mean)
    return np.where(finite, out, np.nan).astype("float32")


def to_db(power: np.ndarray) -> np.ndarray:
    with np.errstate(divide="ignore", invalid="ignore"):
        return (10 * np.log10(np.where(power > 0, power, np.nan))).astype("float32")


def water_thresholds(hh: np.ndarray, hv: np.ndarray) -> tuple[float, float, dict]:
    """
    HH: model the dark (smooth-surface) population: its mode + 1 sigma measured on its left side.
        Otsu would split inside the broad wet-soil/vegetation transition instead.
    HV: open water sits at the instrument noise floor = median HV of the darkest 10 % of HH; +2 dB margin.
    If < 3 % of pixels are darker than -14 dB there is no reliable dark population, so a fixed HH
    threshold (FALLBACK_HH_DB) is used and reported.
    """
    ok = np.isfinite(hh) & np.isfinite(hv)
    hh, hv = hh[ok], hv[ok]
    floor = float(np.median(hv[hh <= np.percentile(hh, 10)]))
    info = {"hvNoiseFloorDb": round(floor, 2), "hvMedianDb": round(float(np.median(hv)), 2)}
    if np.mean(hh < -14) < 0.03:
        info.update({"hhDarkModeDb": None, "hhDarkSigmaDb": None, "fallback": True})
        return FALLBACK_HH_DB, floor + 2.0, info
    hist, edges = np.histogram(hh, bins=240, range=(-30, 0))
    centers = (edges[:-1] + edges[1:]) / 2
    dark = centers < -14
    mode = float(centers[dark][np.argmax(hist[dark])])
    left = hh[hh < mode]
    sigma = float(np.sqrt(np.mean((left - mode) ** 2))) if left.size else 2.0
    info.update({"hhDarkModeDb": round(mode, 2), "hhDarkSigmaDb": round(sigma, 2), "fallback": False})
    return mode + sigma, floor + 2.0, info


def majority3(mask: np.ndarray) -> np.ndarray:
    return median_filter(mask.astype("uint8"), size=3).astype(bool)


def drop_small_patches(mask: np.ndarray, min_px: int) -> np.ndarray:
    """Minimum mapping unit: remove connected patches smaller than min_px (8-connectivity)."""
    lab, n = label(mask, structure=np.ones((3, 3)))
    if n == 0:
        return mask
    keep = np.bincount(lab.ravel()) >= min_px
    keep[0] = False
    return keep[lab]


def stats_block(arr, sel):
    v = arr[sel & np.isfinite(arr)]
    return round(float(np.mean(v)), 2) if v.size else None


def qa_note(qa_b: dict, qa_a: dict) -> str:
    if not qa_b and not qa_a:
        return "the producer's quality-check summary was not available."
    failed = sorted(set(qa_b.get("failed", [])) | set(qa_a.get("failed", [])))
    if not failed:
        return "both scenes passed all of the producer's quality checks."
    if all("identification" in f for f in failed):
        return ("both scenes passed the radar data quality checks; one metadata-only check "
                "('identification group') is reported as FAIL by the producer.")
    return "the producer reports failed quality checks: " + "; ".join(failed)


# --------------------------------------------------------------------------- web export
def _save(rgba: np.ndarray, path: Path):
    img = Image.fromarray(rgba, "RGBA")
    if path.suffix == ".webp":
        img.save(path, "WEBP", quality=82, method=6)
    else:
        img.save(path, optimize=True)


def save_grey(db: np.ndarray, path: Path):
    lo, hi = DISPLAY_DB
    g = np.clip((db - lo) / (hi - lo), 0, 1)
    rgba = np.zeros(db.shape + (4,), dtype="uint8")
    rgba[..., 0] = rgba[..., 1] = rgba[..., 2] = np.nan_to_num(g * 255).astype("uint8")
    rgba[..., 3] = np.where(np.isfinite(db), 255, 0)
    _save(rgba, path)


def save_classes(cls: np.ndarray, path: Path):
    rgba = np.zeros(cls.shape + (4,), dtype="uint8")
    for value, _, _, color in CLASSES:
        rgba[cls == value] = color
    _save(rgba, path)


def save_change(delta: np.ndarray, path: Path):
    """Darkening = blue, brightening = orange; |delta| < CHANGE_DB_SHOW transparent."""
    t = np.clip(np.nan_to_num(delta) / CHANGE_DB_SAT, -1, 1)
    rgba = np.zeros(delta.shape + (4,), dtype="uint8")
    for sel, (r, g, b) in ((t < 0, (37, 99, 235)), (t > 0, (234, 138, 30))):
        rgba[sel, 0], rgba[sel, 1], rgba[sel, 2] = r, g, b
    show = np.isfinite(delta) & (np.abs(delta) >= CHANGE_DB_SHOW)
    rgba[..., 3] = np.where(show, 60 + 195 * np.abs(t), 0).astype("uint8")
    _save(rgba, path)


def _web(arr, ref, web, resampling, nodata):
    dst = np.full(web[1], nodata, dtype=arr.dtype)
    reproject(arr, dst, src_transform=ref["transform"], src_crs=ref["crs"], src_nodata=nodata,
              dst_transform=web[0], dst_crs=WEB_CRS, dst_nodata=nodata, resampling=resampling)
    return dst


# --------------------------------------------------------------------------- main entry
def analyze(b: dict, a: dict, ref: dict, aoi_lonlat, out_dir: Path, study: dict, log=print) -> dict:
    """Run the analysis, write web layers + metadata.json into out_dir, return the metadata."""
    valid = b["valid"] & a["valid"]
    if valid.sum() < 100:
        raise ValueError("The two scenes have almost no valid overlapping pixels in this area.")

    lee_size = 7 if min(b["enl"], a["enl"]) < 8 else 5
    log(f"Speckle filter (Lee {lee_size}x{lee_size})")
    hh_b, hh_a = to_db(lee_filter(b["HHHH"], b["enl"], lee_size)), to_db(lee_filter(a["HHHH"], a["enl"], lee_size))
    hv_b, hv_a = to_db(lee_filter(b["HVHV"], b["enl"], lee_size)), to_db(lee_filter(a["HVHV"], a["enl"], lee_size))
    for arr in (hh_b, hh_a, hv_b, hv_a):
        arr[~valid] = np.nan

    thr, thr_hv, thr_info = water_thresholds(np.concatenate([hh_b[valid], hh_a[valid]]),
                                             np.concatenate([hv_b[valid], hv_a[valid]]))
    log(f"Water-like rule: HH < {thr:.2f} dB and HV < {thr_hv:.2f} dB")
    water_b = majority3(valid & (hh_b < thr) & (hv_b < thr_hv))
    water_a = majority3(valid & (hh_a < thr) & (hv_a < thr_hv))

    # Change patches below the minimum mapping unit are speckle: tiny "receded" stays water, tiny "new" stays dry.
    min_px = max(1, int(round(MIN_PATCH_M2 / ref["res"] ** 2)))
    receded_raw, new_raw = water_b & ~water_a, ~water_b & water_a
    receded_keep, new_keep = drop_small_patches(receded_raw, min_px), drop_small_patches(new_raw, min_px)
    water_a = (water_a | (receded_raw & ~receded_keep)) & ~(new_raw & ~new_keep)

    cls = np.zeros(ref["shape"], dtype="uint8")
    cls[water_b & water_a] = 1
    cls[water_b & ~water_a] = 2
    cls[~water_b & water_a] = 3
    cls[~valid] = 0
    delta = hh_a - hh_b

    px_km2 = ref["res"] ** 2 / 1e6
    n_valid = int(valid.sum())
    km2 = lambda m: round(float(m.sum()) * px_km2, 2)  # noqa: E731
    pct = lambda m: round(100 * float(m.sum()) / n_valid, 1)  # noqa: E731
    receded, new, persistent = cls == 2, cls == 3, cls == 1
    stats = {
        "validAreaKm2": km2(valid),
        "waterThresholdDb": round(thr, 2),
        "waterThresholdHvDb": round(thr_hv, 2),
        "thresholdDerivation": thr_info,
        "waterLikeBefore": {"km2": km2(water_b), "percent": pct(water_b)},
        "waterLikeAfter": {"km2": km2(water_a), "percent": pct(water_a)},
        "persistent": {"km2": km2(persistent), "percent": pct(persistent)},
        "receded": {"km2": km2(receded), "percent": pct(receded)},
        "new": {"km2": km2(new), "percent": pct(new)},
        "netChangeKm2": round(km2(water_a) - km2(water_b), 2),
        "meanHhDb": {"before": stats_block(hh_b, valid), "after": stats_block(hh_a, valid)},
        "meanHvDb": {"before": stats_block(hv_b, valid), "after": stats_block(hv_a, valid)},
        "notableDarkening": {"km2": km2(valid & (delta <= -CHANGE_DB_SIG)), "percent": pct(valid & (delta <= -CHANGE_DB_SIG))},
        "notableBrightening": {"km2": km2(valid & (delta >= CHANGE_DB_SIG)), "percent": pct(valid & (delta >= CHANGE_DB_SIG))},
        "recededSignature": {
            "hhBeforeDb": stats_block(hh_b, receded), "hhAfterDb": stats_block(hh_a, receded),
            "hvBeforeDb": stats_block(hv_b, receded), "hvAfterDb": stats_block(hv_a, receded),
        },
    }
    edges = np.arange(-30, 0.5, 0.5)
    hist = {"binStartDb": edges[:-1].round(1).tolist()}
    for key, arr in (("hhBeforePct", hh_b), ("hhAfterPct", hh_a), ("hvBeforePct", hv_b), ("hvAfterPct", hv_a)):
        hist[key] = (100 * np.histogram(arr[valid], edges)[0] / n_valid).round(3).tolist()

    log("Making map layers")
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("*"):
        if old.is_file():
            old.unlink()
    transform, width, height = calculate_default_transform(ref["crs"], WEB_CRS, ref["shape"][1], ref["shape"][0], *ref["bounds"])
    web = (transform, (height, width))
    files = {"before": "before.webp", "after": "after.webp",
             "waterChange": "water_change.png", "backscatterChange": "backscatter_change.webp"}
    save_grey(_web(hh_b, ref, web, Resampling.bilinear, np.nan), out_dir / files["before"])
    save_grey(_web(hh_a, ref, web, Resampling.bilinear, np.nan), out_dir / files["after"])
    save_classes(_web(cls, ref, web, Resampling.nearest, 0), out_dir / files["waterChange"])
    save_change(_web(delta, ref, web, Resampling.bilinear, np.nan), out_dir / files["backscatterChange"])
    west, north = transform * (0, 0)
    east, south = transform * (width, height)
    lon_w, lat_s, lon_e, lat_n = transform_bounds(WEB_CRS, "EPSG:4326", west, south, east, north)

    sb, sa = b["scene"], a["scene"]
    same_bw = sb["bandwidth"] == sa["bandwidth"]
    same_geom = all(sb[k] == sa[k] for k in ("track", "frame", "direction"))
    same_maturity = sb["collection"] == sa["collection"]
    d_b = b["ident"]["zeroDopplerStartTime"][:10]
    d_a = a["ident"]["zeroDopplerStartTime"][:10]
    days = (datetime.fromisoformat(d_a) - datetime.fromisoformat(d_b)).days

    def scene_info(key, s):
        sc, ident = s["scene"], s["ident"]
        return {
            "key": key,
            "date": ident["zeroDopplerStartTime"][:10],
            "startTimeUtc": ident["zeroDopplerStartTime"][:19] + "Z",
            "sceneName": sc["sceneName"],
            "sourceUrl": sc["sourceUrl"],
            "collection": sc["collection"],
            "productVersion": ident.get("productVersion"),
            "productDoi": ident.get("productDoi"),
            "orbit": ident.get("absoluteOrbitNumber"),
            "track": sc["track"], "frame": sc["frame"],
            "passDirection": ident.get("orbitPassDirection") or sc["direction"],
            "lookDirection": ident.get("lookDirection") or "Left",
            "rangeBandwidthMHz": sc["bandwidth"],
            "nativePixelM": s["native_res"],
            "polarizations": sc["polarizations"],
            "qa": s["qa"] or {"checks": 0, "passed": 0, "failed": []},
        }

    aoi = list(aoi_lonlat)
    metadata = {
        "id": study.get("id", "area"),
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "studyArea": {
            "name": study["name"],
            "region": study.get("region", ""),
            "aoiLonLat": aoi,
            "center": [round((aoi[1] + aoi[3]) / 2, 4), round((aoi[0] + aoi[2]) / 2, 4)],
        },
        "bounds": [[round(lat_s, 6), round(lon_w, 6)], [round(lat_n, 6), round(lon_e, 6)]],
        "before": scene_info("before", b),
        "after": scene_info("after", a),
        "layers": {
            "before": {"file": files["before"], "label": "HH backscatter, before", "stretchDb": DISPLAY_DB},
            "after": {"file": files["after"], "label": "HH backscatter, after", "stretchDb": DISPLAY_DB},
            "waterChange": {
                "file": files["waterChange"],
                "label": "Water-like area change",
                "classes": [{"value": v, "key": k, "label": lbl, "color": f"rgba({c[0]},{c[1]},{c[2]},{c[3] / 255:.2f})"}
                            for v, k, lbl, c in CLASSES],
            },
            "backscatterChange": {
                "file": files["backscatterChange"], "label": "HH backscatter change (after - before)", "units": "dB",
                "hiddenBelowDb": CHANGE_DB_SHOW, "saturationDb": CHANGE_DB_SAT,
                "negativeColor": "rgb(37,99,235)", "positiveColor": "rgb(234,138,30)",
            },
        },
        "processing": {
            "commonGrid": f"{ref['crs']} at {ref['res']:g} m"
                          + ("" if b["native_res"] == a["native_res"] else " (the finer scene is averaged in linear power)"),
            "polarization": "HH for water mapping and change; HV for the vegetation signature",
            "speckleFilter": f"Lee {lee_size}x{lee_size}, ENL from the product's numberOfLooks layer",
            "waterMethod": ("Water-like = HH below " + (f"a fixed {FALLBACK_HH_DB} dB (too little water in the area to derive it)"
                                                      if thr_info.get("fallback") else "(dark-population mode + 1 sigma)")
                            + " AND HV within 2 dB of the HV noise floor; thresholds derived from both dates pooled; "
                            f"3x3 majority clean-up; change patches smaller than {MIN_PATCH_M2 / 1e4:g} ha ignored as speckle"),
            "changeMethod": "HH log-ratio: 10*log10(after/before)",
            "displayProjection": "EPSG:3857 (Web Mercator)",
        },
        "stats": stats,
        "histogram": hist,
        "comparability": {"sameGeometry": same_geom, "sameBandwidth": same_bw, "sameMaturity": same_maturity},
        "caveats": [c for c in [
            "Low radar backscatter is consistent with smooth open water, but it is not proof of water: smooth bare soil, mudflats and radar shadow can also appear dark.",
            "Wind or waves roughen water surfaces and can make water look bright, so some water may be missed.",
            "Flooded vegetation can appear very bright in HH (double-bounce), so water hidden under vegetation is not captured by a darkness threshold.",
            None if same_bw else (f"The two scenes have different range bandwidths ({sb['bandwidth'][0]} vs {sa['bandwidth'][0]} MHz); "
                                  "the finer scene was averaged to the coarser grid, but residual differences remain."),
            None if same_geom else "The two scenes were acquired from different orbit tracks, so viewing angles differ.",
            None if same_maturity else "The two scenes come from different product maturity levels.",
            None if not thr_info.get("fallback") else "This area holds very little water, so a fixed water threshold was used instead of one derived from the data.",
            f"Only two dates, {days} days apart, are compared. The change reflects these two moments, not a trend.",
            "No ground truth or independent water map was used to validate the classification, so areas are estimates.",
            "QA: " + qa_note(b["qa"], a["qa"]),
        ] if c],
        "sources": SOURCES,
    }
    (out_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    log(f"Water-like area {stats['waterLikeBefore']['km2']} -> {stats['waterLikeAfter']['km2']} km2 "
        f"(net {stats['netChangeKm2']:+} km2)")
    return metadata
