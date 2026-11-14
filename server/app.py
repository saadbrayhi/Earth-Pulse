"""
EarthPulse live API: search NISAR GCOV scenes for any small area and run the water-change analysis
on demand, reading only that area from the source files at the Alaska Satellite Facility.

Run (from the repo root):
    .venv/Scripts/python -m uvicorn server.app:app --port 8000          # Windows
    .venv/bin/python -m uvicorn server.app:app --port 8000              # macOS / Linux

Earthdata credentials (server side only, never sent to the browser):
    EARTHDATA_TOKEN, or EARTHDATA_USERNAME + EARTHDATA_PASSWORD, or ~/.netrc

Endpoints:
    GET  /api/health
    GET  /api/scenes?bbox=w,s,e,n[&start=YYYY-MM-DD&end=YYYY-MM-DD]   comparable sets of dates
    POST /api/analyze {"bbox":[w,s,e,n], "before":"<sceneName>", "after":"<sceneName>"}  -> {"jobId"}
    GET  /api/jobs/{jobId}                                             progress / result
    GET  /results/{jobId}/...                                          layers + metadata.json
"""

import hashlib
import math
import os
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from rasterio.transform import array_bounds

from earthpulse.analysis import analyze, to_ref, valid_on_ref
from earthpulse.asf import comparable_sets, search
from earthpulse.remote import AuthError, EarthdataSession
from earthpulse.subset import fetch_qa, read_subset

CACHE = Path(os.environ.get("EARTHPULSE_CACHE", Path(__file__).resolve().parent / "cache"))
CACHE.mkdir(parents=True, exist_ok=True)
MAX_SIDE_KM = float(os.environ.get("EARTHPULSE_MAX_SIDE_KM", "12"))

app = FastAPI(title="EarthPulse live API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.mount("/results", StaticFiles(directory=CACHE), name="results")

JOBS: dict[str, dict] = {}
POOL = ThreadPoolExecutor(max_workers=int(os.environ.get("EARTHPULSE_WORKERS", "2")))
SEARCH_CACHE: dict[tuple, tuple[float, list]] = {}
LOCK = threading.Lock()


# --------------------------------------------------------------------------- helpers
def parse_bbox(text_or_list) -> tuple[float, float, float, float]:
    try:
        w, s, e, n = [float(v) for v in (text_or_list.split(",") if isinstance(text_or_list, str) else text_or_list)]
    except Exception:
        raise HTTPException(400, "bbox must be west,south,east,north in degrees")
    if not (-180 <= w < e <= 180 and -90 <= s < n <= 90):
        raise HTTPException(400, "bbox is not valid")
    km_x = (e - w) * 111.32 * math.cos(math.radians((s + n) / 2))
    km_y = (n - s) * 110.57
    if max(km_x, km_y) > MAX_SIDE_KM:
        raise HTTPException(400, f"Area too large ({km_x:.1f} x {km_y:.1f} km). Maximum side is {MAX_SIDE_KM:g} km.")
    return (round(w, 5), round(s, 5), round(e, 5), round(n, 5))


def cached_search(bbox, start=None, end=None) -> list[dict]:
    key = (bbox, start, end)
    now = time.time()
    with LOCK:
        hit = SEARCH_CACHE.get(key)
        if hit and now - hit[0] < 600:
            return hit[1]
    scenes = search(bbox, start, end)
    with LOCK:
        SEARCH_CACHE[key] = (now, scenes)
    return scenes


def auth_mode() -> str:
    if os.environ.get("EARTHDATA_TOKEN"):
        return "token"
    if os.environ.get("EARTHDATA_USERNAME") and os.environ.get("EARTHDATA_PASSWORD"):
        return "password"
    if (Path.home() / ".netrc").exists() or (Path.home() / "_netrc").exists():
        return "netrc"
    return "none"


# --------------------------------------------------------------------------- endpoints
@app.get("/api/health")
def health():
    return {"ok": True, "auth": auth_mode(), "maxSideKm": MAX_SIDE_KM}


@app.get("/api/scenes")
def scenes(bbox: str = Query(...), start: str | None = None, end: str | None = None):
    b = parse_bbox(bbox)
    try:
        found = cached_search(b, start, end)
    except Exception as exc:  # ASF unavailable etc.
        raise HTTPException(502, f"ASF search failed: {exc}")
    sets = comparable_sets(found)
    return {
        "bbox": b,
        "totalScenes": len(found),
        "coveringScenes": sum(s["coversArea"] for s in found),
        "sets": sets,
    }


class AnalyzeRequest(BaseModel):
    bbox: list[float] = Field(min_length=4, max_length=4)
    before: str
    after: str


@app.post("/api/analyze")
def start_analysis(req: AnalyzeRequest):
    b = parse_bbox(req.bbox)
    job_id = hashlib.sha1(f"{b}|{req.before}|{req.after}".encode()).hexdigest()[:16]
    with LOCK:
        job = JOBS.get(job_id)
        if job and job["status"] in ("queued", "running", "done"):
            return {"jobId": job_id}
        if (CACHE / job_id / "metadata.json").exists():
            JOBS[job_id] = {"status": "done", "log": ["Loaded saved result"], "result": f"/results/{job_id}/"}
            return {"jobId": job_id}
        JOBS[job_id] = {"status": "queued", "log": ["Waiting to start"], "started": time.time()}
    POOL.submit(run_job, job_id, b, req.before, req.after)
    return {"jobId": job_id}


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        if (CACHE / job_id / "metadata.json").exists():
            return {"status": "done", "log": [], "result": f"/results/{job_id}/"}
        raise HTTPException(404, "Unknown job")
    return job


# --------------------------------------------------------------------------- the job
def run_job(job_id: str, bbox, before_name: str, after_name: str):
    job = JOBS[job_id]
    job["status"] = "running"

    def log(msg):
        job["log"].append(msg)

    try:
        log("Finding the two scenes at ASF")
        found = {s["sceneName"]: s for s in cached_search(bbox)}
        if before_name not in found or after_name not in found:
            raise ValueError("Scene not found for this area")
        sb, sa = found[before_name], found[after_name]
        if sb["date"] > sa["date"]:
            sb, sa = sa, sb
        same = all(sb[k] == sa[k] for k in ("direction", "track", "frame", "bandwidth", "maturity"))
        if not same:
            raise ValueError("These two dates are not comparable (different orbit, sharpness or data version).")
        if not (sb["coversArea"] and sa["coversArea"]):
            raise ValueError("One of the scenes does not fully cover the area.")

        def read(scene, label):
            session = EarthdataSession()
            sub = read_subset(session, scene["url"], bbox, log=lambda m: log(f"{label}: {m}"), sample_looks=True)
            sub["qa"] = fetch_qa(session, scene["sceneName"], scene["additionalUrls"])
            return sub

        log(f"Reading only your area from the radar files ({sb['date']} and {sa['date']})")
        with ThreadPoolExecutor(max_workers=2) as ex:
            fb, fa = ex.submit(read, sb, sb["date"]), ex.submit(read, sa, sa["date"])
            rb, ra = fb.result(), fa.result()

        coarse = max((rb, ra), key=lambda r: r["res"])
        h, w = coarse["shape"]
        ref = {"crs": coarse["crs"], "transform": coarse["transform"], "shape": (h, w), "res": coarse["res"],
               "bounds": array_bounds(h, w, coarse["transform"])}

        def on_grid(r, scene):
            arr = r["arrays"]
            out = {
                "HHHH": to_ref(arr["HHHH"], r["transform"], r["crs"], ref),
                "HVHV": to_ref(arr["HVHV"], r["transform"], r["crs"], ref),
                "valid": valid_on_ref(arr["mask"], r["transform"], r["crs"], ref),
                "native_res": r["res"],
                "ident": r["ident"],
                "qa": r["qa"],
                "scene": {
                    "sceneName": scene["sceneName"], "sourceUrl": scene["url"], "collection": scene["collection"],
                    "bandwidth": [scene["bandwidth"]], "polarizations": scene["polarizations"],
                    "track": scene["track"], "frame": scene["frame"], "direction": scene["direction"],
                },
            }
            looks = arr.get("numberOfLooks")
            enl = float(np.nanmedian(looks)) if looks is not None else 4.0
            out["enl"] = enl * (ref["res"] / r["res"]) ** 2
            return out

        b, a = on_grid(rb, sb), on_grid(ra, sa)
        lat, lon = (bbox[1] + bbox[3]) / 2, (bbox[0] + bbox[2]) / 2
        analyze(b, a, ref, bbox, CACHE / job_id,
                {"id": job_id, "name": "Your area", "region": f"{lat:.3f}° N, {lon:.3f}° E"}, log=log)
        mb = (rb["bytes_fetched"] + ra["bytes_fetched"]) / 1e6
        log(f"Done in {time.time() - job.get('started', time.time()):.0f} s ({mb:.0f} MB read from ASF)")
        job["result"] = f"/results/{job_id}/"
        job["status"] = "done"
    except AuthError as exc:
        job["status"], job["error"] = "error", str(exc)
    except Exception as exc:
        traceback.print_exc()
        job["status"], job["error"] = "error", str(exc)
