"""Search ASF for NISAR GCOV scenes and group them into fairly comparable sets.

Two scenes are only compared when they share: orbit direction + track + frame (same viewing
geometry), range bandwidth (same pixel size / sharpness) and product maturity (same processing
family), and when both fully cover the requested area.
"""

from collections import defaultdict

import requests

ASF_API = "https://api.daac.asf.alaska.edu/services/search/param"
PIXEL_M = {"5": 80, "20": 20, "40": 10, "77": 20}  # main-band range bandwidth (MHz) -> GCOV posting


def maturity(collection_name: str) -> str:
    name = (collection_name or "").upper()
    if "BETA" in name:
        return "BETA"
    if "PROVISIONAL" in name:
        return "PROVISIONAL"
    if name.startswith("NISAR_UR"):
        return "URGENT_RESPONSE"
    return "VALIDATED"


def bbox_wkt(b) -> str:
    w, s, e, n = b
    return f"POLYGON(({w} {s},{e} {s},{e} {n},{w} {n},{w} {s}))"


def _inside(pt, ring) -> bool:
    x, y = pt
    c = False
    for i in range(len(ring)):
        x1, y1 = ring[i][:2]
        x2, y2 = ring[i - 1][:2]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def covers(footprint: dict, b) -> bool:
    """True if every corner and the centre of the bbox lie inside the scene footprint."""
    w, s, e, n = b
    pts = [(w, s), (e, s), (e, n), (w, n), ((w + e) / 2, (s + n) / 2)]
    rings = footprint["coordinates"] if footprint["type"] == "Polygon" else [p[0] for p in footprint["coordinates"]]
    outer = [rings[0]] if footprint["type"] == "Polygon" else rings
    return all(any(_inside(p, r) for r in outer) for p in pts)


def search(b, start: str | None = None, end: str | None = None, session: requests.Session | None = None) -> list[dict]:
    """Standard-production (PR) GCOV scenes intersecting bbox b = (west, south, east, north)."""
    params = {"dataset": "NISAR", "processingLevel": "GCOV", "intersectsWith": bbox_wkt(b), "output": "geojson"}
    if start:
        params["start"] = start
    if end:
        params["end"] = end
    r = (session or requests).get(ASF_API, params=params, timeout=120, headers={"User-Agent": "earthpulse"})
    r.raise_for_status()
    out = []
    for f in r.json()["features"]:
        p = f["properties"]
        if p.get("productionConfiguration") != "PR":
            continue  # UR products duplicate PR acquisitions
        bw = (p.get("rangeBandwidth") or ["?"])[0]
        out.append({
            "sceneName": p["sceneName"],
            "date": p["startTime"][:10],
            "startTime": p["startTime"],
            "url": p["url"],
            "direction": p.get("flightDirection"),
            "track": p.get("pathNumber"),
            "frame": p.get("frameNumber"),
            "bandwidth": bw,
            "pixelM": PIXEL_M.get(bw.split("+")[0]),
            "polarizations": p.get("mainBandPolarization") or [],
            "collection": p.get("collectionName"),
            "maturity": maturity(p.get("collectionName", "")),
            "crid": p.get("crid"),
            "coversArea": covers(f["geometry"], b),
            "additionalUrls": p.get("additionalUrls") or [],
            "browse": p.get("browse") or [],
        })
    return out


def comparable_sets(scenes: list[dict]) -> list[dict]:
    """Group scenes that can be compared fairly; best sets first."""
    groups = defaultdict(list)
    for s in scenes:
        if not s["coversArea"]:
            continue
        key = (s["direction"], s["track"], s["frame"], s["bandwidth"], s["maturity"])
        # keep the newest processing (highest CRID) per date
        groups[key].append(s)
    sets = []
    for (direction, track, frame, bw, mat), items in groups.items():
        by_date = {}
        for s in sorted(items, key=lambda s: s.get("crid") or ""):
            by_date[s["date"]] = s
        items = sorted(by_date.values(), key=lambda s: s["date"])
        if len(items) < 2:
            continue
        sets.append({
            "id": f"{direction[0]}{track}-{frame}-{bw}-{mat}",
            "direction": direction,
            "track": track,
            "frame": frame,
            "bandwidth": bw,
            "pixelM": items[0]["pixelM"],
            "maturity": mat,
            "scenes": [{k: s[k] for k in ("sceneName", "date", "startTime", "polarizations", "crid")} for s in items],
        })
    rank = {"VALIDATED": 0, "PROVISIONAL": 1, "BETA": 2, "URGENT_RESPONSE": 3}
    newest = lambda g: -int(g["scenes"][-1]["date"].replace("-", ""))  # noqa: E731
    sets.sort(key=lambda g: (rank.get(g["maturity"], 9), g["pixelM"] or 999, newest(g), -len(g["scenes"])))
    return sets
