"""Probe two catalog-selected DSWx-HLS COG windows using GDAL-supported auth.

Only WTR AOI windows are requested; no credential contents or GDAL errors are logged.
Each source is a single 3660-square byte classification tile (<14 MB uncompressed).
At most two sources are read. Successful crops require coverage/QC before integration.
"""
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import tempfile
from osgeo import gdal

ROOT = Path(__file__).resolve().parents[2]


def main():
    discovery = json.loads((ROOT / "public/data/seasonal-discovery.json").read_text())
    (south, west), (north, east) = discovery["bounds"]
    gdal.UseExceptions()
    # Earthdata redirects need a cookie jar in addition to GDAL's netrc support.
    # TemporaryDirectory is private to this user (0700); session cookies are not public /tmp files.
    auth_directory = tempfile.TemporaryDirectory(prefix="earthpulse-seasonal-auth-")
    cookies = str(Path(auth_directory.name) / "cookies")
    for key, value in {"GDAL_HTTP_NETRC": "YES", "GDAL_HTTP_CONNECTTIMEOUT": "10", "GDAL_HTTP_TIMEOUT": "15",
                       "GDAL_HTTP_MAX_RETRY": "0", "GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
                       "GDAL_HTTP_COOKIEFILE": cookies, "GDAL_HTTP_COOKIEJAR": cookies,
                       "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif"}.items():
        gdal.SetConfigOption(key, value)
    gdal.PushErrorHandler("CPLQuietErrorHandler")
    results = []
    for season in ["dry", "wet"]:
        candidates = [c for q in discovery["results"] if q["season"] == season and q["collection"] == "OPERA_L3_DSWX-HLS_V1"
                      for c in q["candidates"] if c["assets"]]
        candidates.sort(key=lambda c: float(c["cloudCover"]) if c["cloudCover"] is not None else 100)
        if not candidates:
            results.append({"season": season, "status": "No WTR asset found", "integrated": False})
            continue
        candidate = candidates[0]
        result = {"season": season, "productId": candidate["productId"], "sourceUrl": candidate["sourceUrl"],
                  "date": candidate["start"], "integrated": False}
        try:
            url = next(u for u in candidate["assets"] if u.endswith("_B01_WTR.tif"))
            source = gdal.Open("/vsicurl/"+url)
            if source.RasterCount != 1 or source.RasterXSize > 4000 or source.RasterYSize > 4000:
                raise ValueError("Unexpected product size")
            target = ROOT / "data/derived" / f"seasonal-{season}-candidate.tif"
            crop = gdal.Translate(str(target), source, projWin=[west,north,east,south], projWinSRS="EPSG:4326",
                                 creationOptions=["COMPRESS=DEFLATE"])
            crop = None
            result.update(status="Cropped candidate; full-coverage and quality checks still required", cropBytes=target.stat().st_size)
        except Exception as error:
            result.update(status="Raster access unavailable; no classified pixels integrated", errorType=type(error).__name__)
            code = re.search(r"(?:HTTP response code|HTTP error code)[: ]+(\d{3})", str(error))
            if code:
                result["httpStatus"] = int(code.group(1))
        print(season, result["status"], flush=True)
        results.append(result)
    (ROOT / "public/data/seasonal-access.json").write_text(json.dumps({"checkedAt": datetime.now(timezone.utc).isoformat(),
        "maxAssets": 2, "results": results}, indent=2)+"\n")
    gdal.SetConfigOption("GDAL_HTTP_COOKIEFILE", None)
    gdal.SetConfigOption("GDAL_HTTP_COOKIEJAR", None)
    auth_directory.cleanup()


if __name__ == "__main__":
    main()
