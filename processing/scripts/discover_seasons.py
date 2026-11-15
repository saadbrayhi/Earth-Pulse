"""Bounded, public seasonal catalog discovery. No credentials or raster downloads.

Produces candidates, never processed observations or water measurements.
"""
from datetime import datetime, timezone
import json
from pathlib import Path
from nasa_catalog import catalog_query, search_catalog, granule_url

ROOT = Path(__file__).resolve().parents[2]
COLLECTIONS = ["NISAR_L2_GCOV_V1", "NISAR_L2_GCOV_PROVISIONAL_V1", "NISAR_L2_GCOV_BETA_V1", "OPERA_L3_DSWX-HLS_V1", "OPERA_L3_DSWX-S1_V1"]
WINDOWS = {"dry": ["2026-01-01", "2026-02-28"], "wet": ["2026-06-01", "2026-09-30"]}


def main():
    report = json.loads((ROOT / "public/data/analysis.json").read_text())
    results = []
    for season, (start, end) in WINDOWS.items():
        for collection in COLLECTIONS:
            url = catalog_query(report["bounds"], collection, start+"T00:00:00Z", end+"T23:59:59Z", limit=5)
            record = {"season": season, "window": [start, end], "collection": collection, "queryUrl": url}
            try:
                entries, hits = search_catalog(url)
                record.update(status="searched", hits=hits, candidates=[{
                    "id": entry["id"], "productId": entry.get("producer_granule_id", entry.get("title")),
                    "start": entry.get("time_start"), "end": entry.get("time_end"),
                    "sourceUrl": granule_url(entry["id"]), "cloudCover": entry.get("cloud_cover"),
                    "boxes": entry.get("boxes", []),
                    "assets": [link["href"] for link in entry.get("links", [])
                               if link.get("href", "").startswith("https://") and "?" not in link["href"]
                               and link["href"].endswith(".tif") and "WTR" in link["href"]],
                    "processingStatus": "catalog-only",
                } for entry in entries])
            except Exception as error:
                record.update(status="unavailable", errorType=type(error).__name__, candidates=[])
            results.append(record)
            print(season, collection, record.get("hits", record["status"]), flush=True)
    output = {"schemaVersion": 1, "checkedAt": datetime.now(timezone.utc).isoformat(), "bounds": report["bounds"],
              "selectionStatus": "No seasonal classification pair selected or integrated", "maxSamplesPerQuery": 5,
              "imageryDownloaded": False, "results": results}
    (ROOT / "public/data/seasonal-discovery.json").write_text(json.dumps(output, indent=2)+"\n")


if __name__ == "__main__":
    main()
