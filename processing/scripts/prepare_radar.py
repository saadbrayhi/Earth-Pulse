
from pathlib import Path
import json
import numpy as np
import rasterio
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

def load(filename):
    with rasterio.open(ROOT / filename) as ds:
        data = ds.read(1)
        bounds = ds.bounds
        crs = ds.crs
        transform = ds.transform
        shape = data.shape
    valid = np.isfinite(data) & (data > 0)
    db = np.full(shape, np.nan, dtype=np.float32)
    db[valid] = 10 * np.log10(data[valid])
    return db, valid, bounds, crs, transform

before, valid_b, bounds_b, crs_b, grid_b = load(
    "data/raw/hhhh_20261006.tif"
)

after, valid_a, bounds_a, crs_a, grid_a = load(
    "data/raw/hhhh_20261030.tif"
)

if before.shape != after.shape or crs_b != crs_a or not grid_b.almost_equals(grid_a):
    raise ValueError("The two rasters must share the same grid.")

valid = valid_b & valid_a
if not valid.any():
    raise ValueError("No overlapping valid radar pixels.")

# Shared display stretch: same scale for both dates
values = np.concatenate([before[valid], after[valid]])
lo, hi = np.percentile(values, [2, 98])

def save_radar(data, filename):
    intensity = np.clip((data - lo) / max(hi - lo, 1e-6), 0, 1)
    intensity = np.nan_to_num(intensity)
    grey = (intensity * 255).astype(np.uint8)
    rgba = np.stack([grey, grey, grey, valid.astype(np.uint8) * 255], axis=-1)
    Image.fromarray(rgba, "RGBA").save(OUT / filename)

save_radar(before, "before.png")
save_radar(after, "after.png")

# Backscatter change, NOT confirmed flood detection
delta = after - before
rgba = np.zeros((*delta.shape, 4), dtype=np.uint8)
rgba[valid & (delta < -3)] = [40, 110, 220, 190]
rgba[valid & (delta > 3)] = [235, 105, 55, 190]
Image.fromarray(rgba, "RGBA").save(OUT / "change.png")

metadata = {
    "location": "Tanguar Haor, Bangladesh",
    "beforeDate": "2026-10-06",
    "afterDate": "2026-10-30",
    "measurement": "NISAR GCOV Frequency A HHHH",
    "bounds": [
        [bounds_b.bottom, bounds_b.left],
        [bounds_b.top, bounds_b.right]
    ],
    "changeThresholdDb": 3,
    "interpretation": "Radar backscatter change, not validated flooding"
}
(OUT / "metadata.json").write_text(json.dumps(metadata, indent=2))

print("Created before.png, after.png, change.png and metadata.json")
