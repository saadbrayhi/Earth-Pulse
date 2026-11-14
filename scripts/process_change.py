"""
Turn two cropped NISAR GCOV scenes (from fetch_subset.py) into web layers + metadata for EarthPulse.

Input:   data/raw/<YYYYMMDD>/{HHHH,HVHV,mask,numberOfLooks}.tif, identification.json, QA_SUMMARY.csv
Output:  public/data/tanguar-haor/  before.webp, after.webp, water_change.png, backscatter_change.webp, metadata.json

The science lives in earthpulse/analysis.py (shared with the live API in server/).

Choose two scenes with the same product maturity, the same track/frame/direction and the same
range bandwidth (pixel size). Default: 28 Oct -> 9 Nov 2026, ascending track 69 frame 14, VALIDATED, 40 MHz.

Usage:  python scripts/process_change.py [--before 20261028] [--after 20261109]
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import rasterio

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from earthpulse.analysis import analyze, to_ref, valid_on_ref  # noqa: E402
from earthpulse.subset import parse_qa  # noqa: E402

RAW = ROOT / "data" / "raw"
OUT = ROOT / "public" / "data" / "tanguar-haor"
AOI_LONLAT = (90.95, 25.0, 91.2, 25.25)


def load_on_grid(date: str, ref: dict) -> dict:
    folder = RAW / date
    out = {}
    for band in ("HHHH", "HVHV", "numberOfLooks"):
        with rasterio.open(folder / f"{band}.tif") as src:
            out[band] = to_ref(src.read(1), src.transform, src.crs, ref)
            native_res = src.res[0]
    with rasterio.open(folder / "mask.tif") as src:
        out["valid"] = valid_on_ref(src.read(1), src.transform, src.crs, ref)
    out["native_res"] = native_res
    out["enl"] = float(np.nanmedian(out["numberOfLooks"])) * (ref["res"] / native_res) ** 2
    meta = json.loads((folder / "identification.json").read_text(encoding="utf-8"))
    out["ident"] = meta["identification"]
    out["scene"] = {
        "sceneName": meta["scene_name"], "sourceUrl": meta["source_url"], "collection": meta["collection"],
        "bandwidth": meta["range_bandwidth_mhz"], "polarizations": meta["polarizations"],
        "track": meta["track"], "frame": meta["frame"], "direction": meta["flight_direction"],
    }
    qa = folder / "QA_SUMMARY.csv"
    out["qa"] = parse_qa(qa.read_text(encoding="utf-8")) if qa.exists() else {}
    print(f"  {date}: native {native_res:g} m, ENL on common grid ~ {out['enl']:.1f}")
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--before", default="20261028")
    ap.add_argument("--after", default="20261109")
    args = ap.parse_args()

    # Reference grid = the coarser of the two scenes (no up-sampling of real data)
    grids = []
    for d in (args.before, args.after):
        with rasterio.open(RAW / d / "HHHH.tif") as src:
            grids.append(dict(crs=src.crs, transform=src.transform, shape=(src.height, src.width),
                              res=src.res[0], bounds=src.bounds))
    ref = max(grids, key=lambda r: r["res"])
    print(f"Common grid: {ref['crs']}, {ref['res']:g} m, {ref['shape'][1]} x {ref['shape'][0]} px")

    b, a = load_on_grid(args.before, ref), load_on_grid(args.after, ref)
    analyze(b, a, ref, AOI_LONLAT, OUT,
            {"id": "tanguar-haor", "name": "Tanguar Haor", "region": "Sunamganj, Bangladesh"})
    print(f"Wrote layers + metadata.json to {OUT}")


if __name__ == "__main__":
    main()
