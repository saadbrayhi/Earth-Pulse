"""Read only an area of interest from a remote NISAR GCOV .h5 file (no full download).

HDF5 stores the rasters in compressed 512x512 chunks, so h5py over HTTP range requests only
fetches the chunks that overlap the area.
"""

import csv
import io

import h5py
import numpy as np
import requests
from rasterio.crs import CRS
from rasterio.transform import from_origin
from rasterio.warp import transform_bounds

from .remote import RemoteFile

GRID = "science/LSAR/GCOV/grids/frequencyA"
LAYERS = ("HHHH", "HVHV", "mask", "numberOfLooks")


def _py(value):
    if isinstance(value, bytes):
        return value.decode(errors="replace")
    if isinstance(value, np.ndarray):
        return [_py(v) for v in value.tolist()]
    if isinstance(value, np.generic):
        return value.item()
    return value


def read_identification(h5: h5py.File) -> dict:
    out = {}
    for key, ds in h5["science/LSAR/identification"].items():
        if isinstance(ds, h5py.Dataset) and ds.size < 1000:
            out[key] = _py(ds[()])
    return out


def read_subset(session: requests.Session, url: str, aoi_lonlat, layers=LAYERS, log=print, sample_looks=False) -> dict:
    """Crop the AOI from a remote GCOV file. Returns arrays + georeferencing + identification.

    sample_looks=True reads numberOfLooks only in a 128x128 window in the middle (faster; the
    analysis only needs its median)."""
    remote = RemoteFile(session, url)
    with h5py.File(io.BufferedReader(remote, 1 << 20), "r") as h5:
        grid = h5[GRID]
        epsg = int(grid["projection"][()])
        crs = CRS.from_epsg(epsg)
        x, y = grid["xCoordinates"][:], grid["yCoordinates"][:]
        dx, dy = float(x[1] - x[0]), float(y[1] - y[0])
        west, south, east, north = transform_bounds("EPSG:4326", crs, *aoi_lonlat, densify_pts=21)
        cols = np.where((x >= west) & (x <= east))[0]
        rows = np.where((y >= south) & (y <= north))[0]
        if cols.size == 0 or rows.size == 0:
            raise ValueError("The area is outside this scene.")
        r0, r1, c0, c1 = rows[0], rows[-1] + 1, cols[0], cols[-1] + 1
        # x/yCoordinates are pixel centres -> shift half a pixel for the upper-left corner
        transform = from_origin(x[c0] - dx / 2, y[r0] - dy / 2, dx, -dy)
        arrays = {}
        for name in layers:
            if name not in grid:
                continue
            if name == "numberOfLooks" and sample_looks:
                # Only its median is used (ENL), so a small window in the middle is enough.
                rm, cm = (r0 + r1) // 2, (c0 + c1) // 2
                arrays[name] = grid[name][max(r0, rm - 64):min(r1, rm + 64), max(c0, cm - 64):min(c1, cm + 64)]
            else:
                arrays[name] = grid[name][r0:r1, c0:c1]
            log(f"read {name} ({remote.bytes_fetched / 1e6:.0f} MB so far)")
        ident = read_identification(h5)
    return {
        "arrays": arrays, "transform": transform, "crs": crs, "res": abs(dx),
        "shape": (r1 - r0, c1 - c0), "ident": ident, "bytes_fetched": remote.bytes_fetched,
    }


def parse_qa(text: str) -> dict:
    rows = list(csv.DictReader(io.StringIO(text)))
    failed = [r["Check"] for r in rows if (r.get("Result") or "").strip().upper() == "FAIL"]
    return {"checks": len(rows), "passed": len(rows) - len(failed), "failed": failed}


def fetch_qa(session: requests.Session, scene_name: str, urls: list[str]) -> dict:
    """Download and parse the small QA_SUMMARY.csv sidecar, if listed."""
    url = next((u for u in urls if u.endswith(scene_name + "_QA_SUMMARY.csv")), None)
    if not url:
        return {}
    try:
        r = session.get(url, timeout=60)
        return parse_qa(r.text) if r.ok else {}
    except requests.RequestException:
        return {}
