"""Generate clickable category masks without changing the original radar report/assets."""
import json
from pathlib import Path
import numpy as np
import rasterio
from seasonal_core import save_categorical
from analyze_radar import sha256

ROOT=Path(__file__).resolve().parents[2]


def main():
    report=json.loads((ROOT/"public/data/analysis.json").read_text())
    # Refuse stale derived files after source/report changes.
    for source in report["sources"]:
        if sha256(ROOT/source["path"]) != source["sha256"]:
            raise ValueError("Source changed; regenerate radar analysis")
    with rasterio.open(ROOT/"data/derived/delta_db.tif") as ds:
        delta=ds.read(1);profile={**ds.profile,"bounds":ds.bounds}
    with rasterio.open(ROOT/"data/derived/paired_valid_mask.tif") as ds:paired=ds.read(1)==1
    threshold=report["processing"]["thresholdDb"]
    classes=np.full(delta.shape,3,dtype=np.uint8)
    classes[paired & (delta < -threshold)]=0
    classes[paired & (np.abs(delta)<=threshold)]=1
    classes[paired & (delta > threshold)]=2
    colors={0:[40,110,220,220],1:[123,131,118,200],2:[235,105,55,220],3:[166,120,198,230]}
    categories=[]
    keys=["decreased","withinThreshold","increased","invalid"]
    for code,key in enumerate(keys):
        pixels=int((classes==code).sum())
        expected=report["quality"]["invalidPairedPixels"] if key=="invalid" else next(c["pixels"] for c in report["categories"] if c["key"]==key)
        if pixels!=expected:raise ValueError("Stale derived category counts")
        asset=save_categorical(classes,profile,colors,ROOT/"public/data/display","radar-"+key,selected=code)
        categories.append({"key":key,"pixels":pixels,"percentGrid":pixels/classes.size*100,"asset":asset})
    (ROOT/"public/data/radar-categories.json").write_text(json.dumps({"bounds":report["bounds"],"categories":categories},indent=2)+"\n")
    print("Verified original counts; wrote four category overlays")


if __name__=="__main__":main()
