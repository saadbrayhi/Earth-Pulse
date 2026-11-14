"""
Download ONLY the study-area subset of NISAR GCOV scenes (not the 7-9 GB .h5 files).

The .h5 file is read remotely over HTTPS byte-range requests (earthpulse/subset.py), so only the
compressed chunks that overlap the AOI are fetched.

For each date it writes data/raw/<YYYYMMDD>/:
  HHHH.tif, HVHV.tif        gamma0 backscatter, linear power, float32, NaN = no data
  mask.tif                  0 = invalid, 1..N = valid (subswath number), 255 = outside swath
  numberOfLooks.tif         looks per pixel (quality indicator)
  identification.json       acquisition metadata (dates, orbit, look side, ...)
  QA_SUMMARY.csv, LATLON.png   small sidecar files downloaded whole

Requirements: Earthdata login (~/.netrc, or EARTHDATA_TOKEN / EARTHDATA_USERNAME+PASSWORD),
data/gcov_scenes.json from scripts/search_gcov.py.

Usage:
  python scripts/fetch_subset.py --dates 2026-10-28 2026-11-09
"""

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from earthpulse.remote import EarthdataSession  # noqa: E402
from earthpulse.subset import read_subset  # noqa: E402

SCENES_JSON = ROOT / "data" / "gcov_scenes.json"
OUT_DIR = ROOT / "data" / "raw"
AOI_LONLAT = (90.95, 25.0, 91.2, 25.25)  # west, south, east, north (Tanguar Haor)
SIDECARS = ["_QA_SUMMARY.csv", "_LATLON.png"]


def find_scene(scenes: list[dict], date: str) -> dict:
    """Standard-production (PR) GCOV scene for a date; prefer the newest processing (highest CRID)."""
    matches = [p for p in scenes if p["startTime"][:10] == date and p.get("productionConfiguration") == "PR"]
    if not matches:
        raise SystemExit(f"No PR GCOV scene on {date} in {SCENES_JSON}. Run scripts/search_gcov.py first.")
    return max(matches, key=lambda p: p.get("crid", ""))


def write_tif(path: Path, data: np.ndarray, crs, transform, nodata):
    profile = dict(driver="GTiff", height=data.shape[0], width=data.shape[1], count=1, dtype=data.dtype,
                   crs=crs, transform=transform, nodata=nodata, compress="deflate", tiled=True,
                   blockxsize=256, blockysize=256)
    with rasterio.open(path, "w", **profile) as dst:
        dst.write(data, 1)


def download_sidecars(session, scene: dict, out: Path):
    known = [u for u in (scene.get("additionalUrls") or []) + (scene.get("browse") or []) if u.startswith("http")]
    for suffix in SIDECARS:
        name = suffix.lstrip("_.")
        url = next((u for u in known if u.endswith(scene["sceneName"] + suffix)), None)
        r = session.get(url, timeout=120) if url else None
        if r is not None and r.ok:
            (out / name).write_bytes(r.content)
            print(f"    {name:16} {len(r.content) / 1e3:8.1f} KB")
        else:
            print(f"    {name:16} not available")


def fetch(session, scene: dict):
    date = scene["startTime"][:10]
    out = OUT_DIR / date.replace("-", "")
    out.mkdir(parents=True, exist_ok=True)
    print(f"\n== {date}  {scene['sceneName']}")
    t0 = time.time()
    sub = read_subset(session, scene["url"], AOI_LONLAT, log=lambda m: print("    " + m))
    for name, data in sub["arrays"].items():
        nodata = 255 if name == "mask" else (np.nan if data.dtype.kind == "f" else None)
        write_tif(out / f"{name}.tif", data, sub["crs"], sub["transform"], nodata)
    meta = {
        "scene_name": scene["sceneName"], "source_url": scene["url"], "collection": scene.get("collectionName"),
        "crid": scene.get("crid"), "flight_direction": scene.get("flightDirection"), "track": scene.get("pathNumber"),
        "frame": scene.get("frameNumber"), "range_bandwidth_mhz": scene.get("rangeBandwidth"),
        "polarizations": scene.get("mainBandPolarization"), "epsg": sub["crs"].to_epsg(),
        "pixel_size_m": [sub["res"], sub["res"]], "aoi_lonlat": AOI_LONLAT,
        "units": "gamma0 backscatter, linear power", "identification": sub["ident"],
    }
    (out / "identification.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    download_sidecars(session, scene, out)
    print(f"    done in {time.time() - t0:.0f}s, {sub['bytes_fetched'] / 1e6:.0f} MB read")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dates", nargs="+", default=["2026-10-28", "2026-11-09"], help="YYYY-MM-DD acquisition dates")
    args = parser.parse_args()
    scenes = json.loads(SCENES_JSON.read_text(encoding="utf-8"))
    session = EarthdataSession()
    for date in args.dates:
        fetch(session, find_scene(scenes, date))
    print(f"\nAll outputs in {OUT_DIR}")


if __name__ == "__main__":
    main()
