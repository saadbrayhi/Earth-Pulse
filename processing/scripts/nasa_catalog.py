"""Shared bounded NASA CMR metadata access. No authentication or imagery downloads."""
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CMR_SEARCH = "https://cmr.earthdata.nasa.gov/search/granules.json"


def catalog_query(bounds, collection, start, end, limit=5):
    if not 1 <= limit <= 5:
        raise ValueError("Catalog searches are limited to 1–5 metadata records.")
    (south, west), (north, east) = bounds
    return CMR_SEARCH + "?" + urlencode({
        "short_name": collection,
        "bounding_box": f"{west},{south},{east},{north}",
        "temporal": f"{start},{end}",
        "page_size": limit,
        "sort_key": "start_date",
    })


def search_catalog(url):
    request = Request(url, headers={"User-Agent": "EarthPulse-research/1.0"})
    with urlopen(request, timeout=15) as response:
        entries = json.load(response).get("feed", {}).get("entry", [])
        hits = int(response.headers.get("CMR-Hits", len(entries)))
    return entries, hits


def granule_url(identifier):
    return f"https://cmr.earthdata.nasa.gov/search/concepts/{identifier}.html"
