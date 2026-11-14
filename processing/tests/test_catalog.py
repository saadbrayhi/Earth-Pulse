"""Offline contract checks for the shared NASA metadata client."""
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("catalog", ROOT / "processing/scripts/nasa_catalog.py")
catalog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalog)


class CatalogTests(unittest.TestCase):
    def test_query_uses_longitude_latitude_order_and_caps_results(self):
        bounds = [[25, 90.95], [25.25, 91.2]]
        url = catalog.catalog_query(bounds, "GCOV", "2026-10-01", "2026-11-06", limit=5)
        params = parse_qs(urlparse(url).query)
        self.assertEqual(params["bounding_box"], ["90.95,25,91.2,25.25"])
        self.assertEqual(params["temporal"], ["2026-10-01,2026-11-06"])
        self.assertEqual(params["page_size"], ["5"])
        for limit in [0, 6, 100]:
            with self.assertRaises(ValueError):
                catalog.catalog_query(bounds, "GCOV", "start", "end", limit)

    def test_search_separates_total_hits_from_bounded_samples(self):
        response = io.BytesIO(json.dumps({"feed": {"entry": [{"id": "G1"}]}}).encode())
        response.headers = {"CMR-Hits": "12"}
        with patch.object(catalog, "urlopen", return_value=response) as request:
            records, hits = catalog.search_catalog("https://cmr.earthdata.nasa.gov/search/granules.json")
        self.assertEqual(records, [{"id": "G1"}])
        self.assertEqual(hits, 12)
        self.assertEqual(request.call_args.kwargs["timeout"], 15)


if __name__ == "__main__":
    unittest.main()
