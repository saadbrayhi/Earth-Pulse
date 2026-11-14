"""Bounded public NASA CMR metadata search. Downloads no imagery or credentials."""
import json
from pathlib import Path
from nasa_catalog import catalog_query, search_catalog, granule_url
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
COLLECTIONS = ["NISAR_L2_GCOV_V1", "NISAR_L2_GCOV_PROVISIONAL_V1", "NISAR_L2_GCOV_BETA_V1",
               "OPERA_L3_DSWX-HLS_V1", "OPERA_L3_DSWX-S1_V1", "HLSL30"]


def main():
    metadata = json.loads((ROOT / "public/data/metadata.json").read_text())
    results = []
    for name in COLLECTIONS:
        url = catalog_query(metadata["bounds"], name, "2026-10-01T00:00:00Z", "2026-11-06T23:59:59Z")
        try:
            items, hits = search_catalog(url)
            result = {
                "collection": name,
                "queryUrl": url,
                "hits": hits,
                "samples": [{"id": e.get("id"), "productId": e.get("producer_granule_id", e.get("title")),
                    "observationStart": e.get("time_start"), "observationEnd": e.get("time_end"),
                    "cloudCover": e.get("cloud_cover"), "sourceUrl": granule_url(e["id"])} for e in items],
            }
        except Exception as error:
            # No auth used; avoid logging exception payloads or redirects.
            result = {
                "collection": name,
                "queryUrl": url,
                "status": "unavailable",
                "errorType": type(error).__name__,
            }
        results.append(result)
        print(name, result.get("hits", result.get("status")), flush=True)
    report = {
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "bounds": metadata["bounds"],
        "temporalWindow": ["2026-10-01", "2026-11-06"],
        "maxSamplesPerCollection": 5,
        "imageryDownloaded": False,
        "datasetsIntegrated": [],
        "results": results,
    }
    (ROOT / "public/data/discovery.json").write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
