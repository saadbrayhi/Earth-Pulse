"""Pure water-transition accounting and lossless categorical map previews."""
from pathlib import Path
import hashlib
import numpy as np
from PIL import Image
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, reproject, transform_bounds

WATER_COLORS = {0: [123,131,118,170], 1: [40,110,220,220], 2: [202,145,45,220],
                3: [39,172,159,230], 255: [166,120,198,200]}
TRANSITIONS = [(3,"bothDates","Water on both dates"), (1,"wetOnly","Wet-date-only water"),
               (2,"dryOnly","Dry-date-only water"), (0,"neither","Neither classified as water")]


def decode_wtr(values, valid):
    """A classified pixel footprint, not an estimate of fractional subpixel water."""
    out = np.full(values.shape, 255, dtype=np.uint8)
    out[valid & (values == 0)] = 0
    out[valid & np.isin(values, [1, 2])] = 1
    return out


def transition_summary(dry, wet, pixel_area_km2):
    if dry.shape != wet.shape or dry.ndim != 2 or pixel_area_km2 <= 0:
        raise ValueError("Expected matching 2D masks and a positive equal-area cell size")
    if not np.isin(dry, [0,1,255]).all() or not np.isin(wet, [0,1,255]).all():
        raise ValueError("Normalized masks must use 0, 1 and 255")
    paired = (dry != 255) & (wet != 255)
    count = int(paired.sum())
    if not count:
        raise ValueError("No valid paired classification coverage")
    classes = np.full(dry.shape, 255, dtype=np.uint8)
    classes[paired] = dry[paired]*2 + wet[paired]
    cells = [{"key": key, "label": label, "code": code, "pixels": int((classes==code).sum()),
              "areaKm2": float((classes==code).sum()*pixel_area_km2),
              "percentValidArea": float((classes==code).sum()/count*100)} for code,key,label in TRANSITIONS]
    dry_area = float(((dry==1)&paired).sum()*pixel_area_km2)
    wet_area = float(((wet==1)&paired).sum()*pixel_area_km2)
    return classes, {"pairedPixels": count, "unknownPixels": int(dry.size-count),
                     "coveragePercent": count/dry.size*100, "comparedAreaKm2": count*pixel_area_km2,
                     "dryWaterAreaKm2": dry_area, "wetWaterAreaKm2": wet_area,
                     "netDifferenceKm2": wet_area-dry_area, "transitions": cells}


def save_categorical(data, profile, colors, output_dir, name, selected=None):
    west,south,east,north = transform_bounds(profile["crs"], "EPSG:3857", *profile["bounds"])
    scale = max(east-west,north-south)/1200
    width,height = max(1,round((east-west)/scale)),max(1,round((north-south)/scale))
    dest = np.full((height,width),255,dtype=np.uint8)
    reproject(data, dest, src_transform=profile["transform"], src_crs=profile["crs"],
              dst_transform=from_bounds(west,south,east,north,width,height), dst_crs="EPSG:3857",
              resampling=Resampling.nearest, init_dest_nodata=False)
    rgba=np.zeros((height,width,4),dtype=np.uint8)
    for code,color in colors.items():
        if selected is None or code == selected:
            rgba[dest==code]=color
    output_dir=Path(output_dir); output_dir.mkdir(parents=True,exist_ok=True)
    temp=output_dir/(name+".webp")
    Image.fromarray(rgba).save(temp,"WEBP",lossless=True,method=6)
    digest=hashlib.sha256(temp.read_bytes()).hexdigest()[:12]
    final=output_dir/f"{name}-{digest}.webp";temp.replace(final)
    return {"url":"/data/display/"+final.name,"bytes":final.stat().st_size,"width":width,"height":height,
            "projection":"EPSG:3857","encoding":"lossless WebP"}
