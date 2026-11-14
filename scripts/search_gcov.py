"""
Search ASF for NISAR L2 GCOV scenes over the EarthPulse study area and save the results.

Study area: Tanguar Haor wetland, Sunamganj, Bangladesh
AOI:        POLYGON((90.95 25,91.2 25,91.2 25.25,90.95 25.25,90.95 25))

Uses only the Python standard library (no asf_search / requests needed).
Searching is anonymous; downloading the .h5 files later needs an Earthdata login.

Usage:
    python scripts/search_gcov.py              # standard production (PR) scenes only
    python scripts/search_gcov.py --include-ur  # also keep urgent-response (UR) duplicates

Outputs (in data/):
    gcov_scenes.json  - full metadata for every scene
    gcov_scenes.csv   - one row per scene, the key columns
"""

import argparse
import csv
import json
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

AOI_WKT = "POLYGON((90.95 25,91.2 25,91.2 25.25,90.95 25.25,90.95 25))"
ASF_API = "https://api.daac.asf.alaska.edu/services/search/param"
OUT_DIR = Path(__file__).resolve().parent.parent / "data"


def search_gcov(aoi_wkt: str) -> list[dict]:
    """Return the raw `properties` dict of every NISAR GCOV scene intersecting the AOI."""
    params = {
        "dataset": "NISAR",
        "processingLevel": "GCOV",
        "intersectsWith": aoi_wkt,
        "output": "geojson",
    }
    url = f"{ASF_API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "earthpulse-gcov-search"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.load(resp)
    scenes = []
    for feature in data["features"]:
        props = feature["properties"]
        props["footprint"] = feature["geometry"]
        scenes.append(props)
    return scenes


def maturity(collection_name: str) -> str:
    """Product maturity from the collection name (see NISAR availability docs)."""
    name = collection_name.upper()
    if "BETA" in name:
        return "BETA"
    if "PROVISIONAL" in name:
        return "PROVISIONAL"
    if name.startswith("NISAR_UR"):
        return "URGENT_RESPONSE"
    return "VALIDATED"


def parse_scene_name(scene_name: str) -> dict:
    """
    Pull fields out of the granule name, e.g.
    NISAR_L2_PR_GCOV_035_091_D_076_2005_QPDH_A_20261111T123421_20261111T123456_P05036_N_F_J_001
                     cyc trk dir frm mode pol
    """
    parts = scene_name.split("_")
    return {
        "cycle": int(parts[4]),
        "track": int(parts[5]),
        "direction_code": parts[6],
        "frame": int(parts[7]),
        "mode_code": parts[8],
        "pol_mode": parts[9],
    }


def to_row(p: dict) -> dict:
    name_fields = parse_scene_name(p["sceneName"])
    h5_size = sum(v["bytes"] for v in (p.get("bytes") or {}).values())
    return {
        "date": p["startTime"][:10],
        "start_time": p["startTime"],
        "stop_time": p["stopTime"],
        "direction": p["flightDirection"],
        "track": p["pathNumber"],
        "frame": p["frameNumber"],
        "cycle": name_fields["cycle"],
        "orbit": p["orbit"],
        "pol_mode": name_fields["pol_mode"],
        "main_band_pol": "+".join(p.get("mainBandPolarization") or []),
        "side_band_pol": "+".join(p.get("sideBandPolarization") or []),
        "range_bandwidth": "+".join(p.get("rangeBandwidth") or []),
        "frame_coverage": p.get("frameCoverage"),
        "production": p.get("productionConfiguration"),
        "maturity": maturity(p.get("collectionName", "")),
        "crid": p.get("crid"),
        "pge_version": p.get("pgeVersion"),
        "processing_date": p.get("processingDate"),
        "size_gb": round(h5_size / 1e9, 2),
        "scene_name": p["sceneName"],
        "h5_url": p["url"],
        "browse_png": (p.get("browse") or [None])[0],
    }


def print_table(rows: list[dict]) -> None:
    header = f"{'#':>2}  {'date':10}  {'dir':4} {'trk':>3} {'frm':>3} {'cyc':>3}  {'pol':4} {'main pol':12} {'maturity':12} {'crid':6} {'GB':>5}"
    print(header)
    print("-" * len(header))
    for i, r in enumerate(rows, 1):
        print(
            f"{i:>2}  {r['date']:10}  {r['direction'][:4]:4} {r['track']:>3} {r['frame']:>3} {r['cycle']:>3}  "
            f"{r['pol_mode']:4} {r['main_band_pol']:12} {r['maturity']:12} {r['crid']:6} {r['size_gb']:>5}"
        )


def print_stacks(rows: list[dict]) -> None:
    """Group by viewing geometry: only scenes in the same stack are directly comparable."""
    stacks = defaultdict(list)
    for r in rows:
        stacks[(r["direction"], r["track"], r["frame"])].append(r)

    print("\nComparable stacks (same direction / track / frame):")
    for (direction, track, frame), items in sorted(stacks.items()):
        items.sort(key=lambda r: r["date"])
        mats = defaultdict(int)
        for r in items:
            mats[r["maturity"]] += 1
        mat_str = ", ".join(f"{k}={v}" for k, v in sorted(mats.items()))
        print(f"  {direction:10} track {track:>3} frame {frame:>3}: {len(items):>2} scenes  "
              f"{items[0]['date']} -> {items[-1]['date']}  ({mat_str})")
        print("     dates: " + " ".join(r["date"][5:] for r in items))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--include-ur", action="store_true",
                        help="keep urgent-response (UR) products, which duplicate PR acquisitions")
    args = parser.parse_args()

    raw = search_gcov(AOI_WKT)
    print(f"ASF returned {len(raw)} GCOV products for the AOI")

    if not args.include_ur:
        raw = [p for p in raw if p.get("productionConfiguration") == "PR"]
        print(f"Keeping {len(raw)} standard production (PR) scenes (use --include-ur to keep UR duplicates)\n")

    raw.sort(key=lambda p: p["startTime"])
    rows = [to_row(p) for p in raw]

    print_table(rows)
    print_stacks(rows)

    OUT_DIR.mkdir(exist_ok=True)
    (OUT_DIR / "gcov_scenes.json").write_text(json.dumps(raw, indent=2), encoding="utf-8")
    with open(OUT_DIR / "gcov_scenes.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nSaved {len(rows)} scenes to {OUT_DIR / 'gcov_scenes.csv'} and gcov_scenes.json")


if __name__ == "__main__":
    main()
