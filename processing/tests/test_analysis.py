import importlib.util
from pathlib import Path
import json
import unittest
from types import SimpleNamespace

import numpy as np
from rasterio.crs import CRS
from rasterio.transform import from_origin
from rasterio.coords import BoundingBox
import rasterio
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("analyze", ROOT / "processing/scripts/analyze_radar.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AnalysisTests(unittest.TestCase):
    def test_power_mask_and_decibels(self):
        power = np.array([1, 10, 0.01, 0, -1, np.nan, np.inf, 100], dtype=np.float32)
        db, mask = module.power_to_db(power, [1, 1, 1, 1, 1, 1, 1, 0])
        np.testing.assert_allclose(db[:3], [0, 10, -20], atol=1e-5)
        self.assertEqual(mask.tolist(), [True, True, True, False, False, False, False, False])
        self.assertTrue(np.isnan(db[3:]).all())

    def test_grid_mismatch_is_rejected(self):
        first = SimpleNamespace(crs=CRS.from_epsg(4326), shape=(2, 2), transform=from_origin(90, 25, .01, .01))
        second = SimpleNamespace(**vars(first))
        module.check_alignment(first, second)
        second.transform = from_origin(90.001, 25, .01, .01)
        with self.assertRaises(ValueError):
            module.check_alignment(first, second)

    def test_equal_area_rows(self):
        # A 1-degree equatorial cell is about 12,309 square km, not one square metre.
        area = module.row_areas_km2(BoundingBox(0, 0, 1, 1), 10, 10)
        self.assertAlmostEqual(float(area.sum() * 10), 12308.46, delta=2)
        self.assertTrue((area > 0).all())

    def test_generated_population_accounting(self):
        data = json.loads((ROOT / "public/data/analysis.json").read_text())
        n = data["quality"]["pairedValidPixels"]
        self.assertEqual(sum(b["pixels"] for b in data["histogram"]), n)
        self.assertEqual(sum(c["pixels"] for c in data["categories"]), n)
        self.assertAlmostEqual(sum(c["percentValid"] for c in data["categories"]), 100)
        self.assertAlmostEqual(sum(c["areaKm2"] for c in data["categories"]), data["quality"]["pairedAreaKm2"], places=6)
        self.assertEqual(data["quality"]["totalPixels"], n + data["quality"]["invalidPairedPixels"])
        for asset in data["assets"].values():
            self.assertEqual((ROOT / "public" / asset["url"].lstrip("/")).stat().st_size, asset["bytes"])

    def test_results_match_original_power_values(self):
        data = json.loads((ROOT / "public/data/analysis.json").read_text())
        with rasterio.open(ROOT / data["sources"][0]["path"]) as src:
            before = src.read(1, masked=True)
        with rasterio.open(ROOT / data["sources"][1]["path"]) as src:
            after = src.read(1, masked=True)
        valid = ~np.ma.getmaskarray(before) & ~np.ma.getmaskarray(after) & np.isfinite(before.data) & np.isfinite(after.data) & (before.data > 0) & (after.data > 0)
        difference = 10 * np.log10(after.data[valid]) - 10 * np.log10(before.data[valid])
        self.assertEqual(int(valid.sum()), data["quality"]["pairedValidPixels"])
        self.assertAlmostEqual(float(difference.mean(dtype=np.float64)), data["delta"]["meanDb"], places=6)
        self.assertEqual(int((difference < -3).sum()), data["categories"][0]["pixels"])
        self.assertEqual(int((difference > 3).sum()), data["categories"][2]["pixels"])
        for source in data["sources"]:
            self.assertEqual(module.sha256(ROOT / source["path"]), source["sha256"])

    def test_change_preview_keeps_exact_category_colors(self):
        data = json.loads((ROOT / "public/data/analysis.json").read_text())
        with Image.open(ROOT / "public" / data["assets"]["change"]["url"].lstrip("/")) as image:
            pixels = np.asarray(image.convert("RGBA"))
        visible = pixels[pixels[:, :, 3] > 0]
        self.assertEqual(set(map(tuple, np.unique(visible, axis=0))), {(40, 110, 220, 190), (235, 105, 55, 190)})


if __name__ == "__main__":
    unittest.main()
