"""Process an explicitly selected same-version DSWx-HLS WTR pair, or report unavailable.

No discovery, authentication, downloads, training or claimed independent validation.
Inputs must be full selected source tiles/crops with documented acquisition metadata.
"""
import argparse
from datetime import date
import json
import math
import re
from pathlib import Path
import numpy as np
import rasterio
from rasterio.transform import from_origin, array_bounds
from rasterio.warp import Resampling, reproject, transform_bounds
from analyze_radar import sha256, write_raster
from seasonal_core import decode_wtr, transition_summary, save_categorical, WATER_COLORS

ROOT=Path(__file__).resolve().parents[2]


def normalize_observation(record, profile):
    if record["productType"] != "DSWx-HLS-WTR-v1" or not record.get("sourceUrl") or not record.get("productId"):
        raise ValueError("Only source-documented DSWx-HLS WTR inputs are supported")
    date.fromisoformat(record["date"])
    encoded = re.search(r"_(\d{8})T", record["productId"])
    if not encoded or encoded.group(1) != record["date"].replace("-", "") or not record["productId"].endswith("_v"+record["processingVersion"]):
        raise ValueError("Manifest date/version does not match the DSWx acquisition identifier")
    data=np.full((profile["height"],profile["width"]),255,dtype=np.uint8)
    with rasterio.open(ROOT/record["path"]) as source:
        if source.count!=1 or source.crs is None:
            raise ValueError("Expected a georeferenced single-band classification")
        normalized=decode_wtr(source.read(1),source.read_masks(1)>0)
        reproject(normalized,data,src_transform=source.transform,src_crs=source.crs,
                  dst_transform=profile["transform"],dst_crs=profile["crs"],
                  src_nodata=255,dst_nodata=255,resampling=Resampling.nearest)
    return data


def main():
    parser=argparse.ArgumentParser();parser.add_argument("--manifest",default="processing/seasonal-inputs.json")
    args=parser.parse_args();manifest=json.loads((ROOT/args.manifest).read_text())
    base=json.loads((ROOT/"public/data/analysis.json").read_text())
    output={"schemaVersion":1,"status":"unavailable","reason":manifest.get("reason","No selected inputs"),
            "observations":[],"metrics":None,"assets":{},"bounds":base["bounds"],
            "method":manifest["classificationPolicy"],"methodSource":manifest["methodSource"],
            "validation":{"status":"not-performed","metrics":None},
            "limitations":["Two dates do not establish permanent or year-round water.",
                "Seasonal differences are not validated flood extent.","Analysis rectangle is not an official Ramsar boundary."]}
    if manifest["observations"]:
        records=manifest["observations"]
        if len(records)!=2 or {r["season"] for r in records}!={"dry","wet"}:
            raise ValueError("Select exactly one documented dry/wet pair; composites require an explicit aggregation method")
        if len({(r["productType"],r["processingVersion"]) for r in records})!=1:
            raise ValueError("Different product methods/versions require a documented harmonization workflow")
        (south,west),(north,east)=base["bounds"]
        region_left,bottom,right,region_top=transform_bounds("EPSG:4326","EPSG:6933",west,south,east,north)
        left,top=region_left,region_top
        resolution=30;left=math.floor(left/resolution)*resolution;top=math.ceil(top/resolution)*resolution
        width=math.ceil((right-left)/resolution);height=math.ceil((top-bottom)/resolution)
        profile={"crs":"EPSG:6933","transform":from_origin(left,top,resolution,resolution),"width":width,"height":height}
        masks={r["season"]:normalize_observation(r,profile) for r in records}
        # The comparison excludes cells whose centres are outside the supplied rectangle.
        xs=left+(np.arange(width)+.5)*resolution;ys=top-(np.arange(height)+.5)*resolution
        in_region=(xs[None,:]>=region_left)&(xs[None,:]<right)&(ys[:,None]>bottom)&(ys[:,None]<=region_top)
        for mask in masks.values():mask[~in_region]=255
        classes,metrics=transition_summary(masks["dry"],masks["wet"],resolution**2/1e6)
        metrics["coveragePercent"]=metrics["pairedPixels"]/int(in_region.sum())*100
        metrics["unknownPixels"]=int(in_region.sum())-metrics["pairedPixels"]
        profile["bounds"]=array_bounds(height,width,profile["transform"])
        # Map overlay bounds describe the actual aligned preview extent.
        bw,bs,be,bn=transform_bounds(profile["crs"],"EPSG:4326",*profile["bounds"])
        output["bounds"]=[[bs,bw],[bn,be]]
        display=ROOT/"public/data/display";derived=ROOT/"data/derived"
        derived.mkdir(parents=True, exist_ok=True)
        output.update(status="classified",reason="Independent local validation has not been performed.",metrics=metrics)
        for record in records:
            key=record["season"]
            asset=save_categorical(masks[key],profile,{0:WATER_COLORS[0],1:WATER_COLORS[1],255:WATER_COLORS[255]},display,"seasonal-"+key)
            output["assets"][key]=asset
            output["observations"].append({**record,"sha256":sha256(ROOT/record["path"]),"asset":asset})
            write_raster(derived/f"seasonal-{key}.tif",masks[key],{k:v for k,v in profile.items() if k!="bounds"},255)
        output["assets"]["change"]=save_categorical(classes,profile,WATER_COLORS,display,"seasonal-transitions")
        for cell in metrics["transitions"]:
            cell["asset"]=save_categorical(classes,profile,WATER_COLORS,display,"seasonal-"+cell["key"],cell["code"])
        output["areaMethod"]="30 m EPSG:6933 equal-area cell footprints, common valid classification mask"
    (ROOT/"public/data/seasonal.json").write_text(json.dumps(output,indent=2,allow_nan=False)+"\n")
    print(output["status"],output["reason"])


if __name__=="__main__":main()
