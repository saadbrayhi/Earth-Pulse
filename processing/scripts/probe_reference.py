"""Probe at most one near-date DSWx-HLS WTR COG per supplied observation.

GDAL reads only a study-area window, using its supported local netrc handling.
No credentials are read by this script. Crops go to /tmp, not to the application.
Requires system GDAL Python bindings. No water validation is inferred here.
"""
import json
from pathlib import Path
from datetime import date, timedelta
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from osgeo import gdal

ROOT = Path(__file__).resolve().parents[2]


def main():
    metadata = json.loads((ROOT / "public/data/metadata.json").read_text())
    (south, west), (north, east) = metadata["bounds"]
    gdal.UseExceptions()
    gdal.SetConfigOption("GDAL_HTTP_NETRC", "YES")
    gdal.SetConfigOption("GDAL_HTTP_CONNECTTIMEOUT", "10")
    gdal.SetConfigOption("GDAL_HTTP_TIMEOUT", "20")
    gdal.SetConfigOption("GDAL_HTTP_MAX_RETRY", "0")
    gdal.SetConfigOption("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")
    gdal.SetConfigOption("CPL_VSIL_CURL_ALLOWED_EXTENSIONS", ".tif")
    gdal.PushErrorHandler("CPLQuietErrorHandler")
    results = []
    for label, observed in [("before", metadata["beforeDate"]), ("after", metadata["afterDate"])]:
        day = date.fromisoformat(observed)
        params = {"short_name": "OPERA_L3_DSWX-HLS_V1", "bounding_box": f"{west},{south},{east},{north}", "page_size": 1,
                  "temporal": f"{day-timedelta(days=1)}T00:00:00Z,{day+timedelta(days=1)}T23:59:59Z", "sort_key": "start_date"}
        query = "https://cmr.earthdata.nasa.gov/search/granules.json?" + urlencode(params)
        result = {"targetDate": observed, "queryUrl": query, "integrated": False}
        try:
            with urlopen(Request(query, headers={"User-Agent": "EarthPulse-research/1.0"}), timeout=15) as response:
                entries = json.load(response).get("feed", {}).get("entry", [])
            if not entries:
                result["status"] = "No near-date catalog candidates"
            else:
                entry = entries[0]
                result.update(productId=entry.get("producer_granule_id", entry.get("title")), observationStart=entry.get("time_start"),
                              sourceUrl="https://cmr.earthdata.nasa.gov/search/concepts/" + entry["id"] + ".html")
                urls = [v["href"] for v in entry.get("links", []) if v.get("href", "").startswith("https://") and "B01_WTR.tif" in v.get("href", "") and "?" not in v["href"]]
                if not urls:
                    result["status"] = "No direct WTR HTTPS asset in returned granule metadata"
                else:
                    ds = gdal.Open("/vsicurl/" + urls[0])
                    target = f"/tmp/earthpulse-reference-{label}.tif"
                    cropped = gdal.Translate(target, ds, projWin=[west, north, east, south], projWinSRS="EPSG:4326", creationOptions=["COMPRESS=DEFLATE"])
                    cropped = None
                    result["status"] = "Study window retrieved; classification and independent validation still required"
                    result["cropBytes"] = Path(target).stat().st_size
        except Exception as error:
            result.update(status="Reference access unavailable; no raster integrated", errorType=type(error).__name__)
        results.append(result)
        print(label, result["status"], flush=True)
    (ROOT / "public/data/reference-probe.json").write_text(json.dumps({"maxCandidatesPerDate": 1, "results": results}, indent=2) + "\n")


if __name__ == "__main__":
    main()
