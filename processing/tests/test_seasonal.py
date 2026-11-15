"""Synthetic fixtures test accounting only; never exported as observation data."""
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import json
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/"processing/scripts"))
from seasonal_core import decode_wtr, transition_summary, save_categorical, WATER_COLORS
import analyze_seasonal


class SeasonalTests(unittest.TestCase):
    def test_quality_mask_excludes_clouds_snow_fill_and_invalid_samples(self):
        raw=np.array([[0,1,2,252,253,254,255,1]],dtype=np.uint8)
        valid=np.ones_like(raw,dtype=bool);valid[0,-1]=False
        self.assertEqual(decode_wtr(raw,valid).tolist(),[[0,1,1,255,255,255,255,255]])

    def test_transitions_conserve_area_and_exclude_unknown(self):
        dry=np.array([[1,0,1,0,255]],dtype=np.uint8)
        wet=np.array([[1,1,0,0,1]],dtype=np.uint8)
        classes,metrics=transition_summary(dry,wet,.0009)
        self.assertEqual(classes.tolist(),[[3,1,2,0,255]])
        self.assertEqual(metrics['pairedPixels'],4)
        self.assertEqual(metrics['unknownPixels'],1)
        self.assertEqual(metrics['coveragePercent'],80)
        self.assertAlmostEqual(sum(c['areaKm2'] for c in metrics['transitions']),metrics['comparedAreaKm2'])
        self.assertEqual(metrics['netDifferenceKm2'],0)
        self.assertAlmostEqual(sum(c['percentValidArea'] for c in metrics['transitions']),100)

    def test_recession_net_sign_and_no_unknown_as_dry_land(self):
        _,m=transition_summary(np.array([[1,1,255]],dtype=np.uint8),np.array([[0,1,0]],dtype=np.uint8),1)
        self.assertEqual(m['netDifferenceKm2'],-1)
        self.assertEqual(next(c['pixels'] for c in m['transitions'] if c['key']=='neither'),0)

    def test_invalid_inputs_do_not_produce_water_statistics(self):
        with self.assertRaises(ValueError):transition_summary(np.array([[255]]),np.array([[1]]),1)
        with self.assertRaises(ValueError):transition_summary(np.array([[2]]),np.array([[1]]),1)
        with self.assertRaises(ValueError):transition_summary(np.ones((1,2)),np.ones((2,1)),1)

    def test_preview_preserves_classes_and_selected_mask(self):
        with tempfile.TemporaryDirectory() as tmp:
            data=np.array([[0,1],[2,3]],dtype=np.uint8)
            p={'crs':'EPSG:4326','bounds':(90.95,25,91.2,25.25),'transform':from_bounds(90.95,25,91.2,25.25,2,2)}
            asset=save_categorical(data,p,WATER_COLORS,tmp,'test-fixture',selected=1)
            im=np.array(Image.open(Path(tmp)/Path(asset['url']).name).convert('RGBA'))
            self.assertEqual(set(np.unique(im[:,:,3])),{0,220})
            self.assertTrue((im[im[:,:,3]>0]==WATER_COLORS[1]).all())

    def test_pipeline_produces_truthful_unavailable_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'public/data').mkdir(parents=True);(root/'processing').mkdir()
            (root/'public/data/analysis.json').write_text(json.dumps({'bounds':[[25,90.95],[25.25,91.2]]}))
            (root/'processing/seasonal-inputs.json').write_text(json.dumps({'observations':[],'reason':'No real pixels','classificationPolicy':'documented','methodSource':'https://example.org'}))
            with patch.object(analyze_seasonal,'ROOT',root),patch.object(sys,'argv',['analyze_seasonal.py']):analyze_seasonal.main()
            result=json.loads((root/'public/data/seasonal.json').read_text())
            self.assertEqual(result['status'],'unavailable');self.assertIsNone(result['metrics']);self.assertEqual(result['observations'],[])

    def test_actual_catalog_and_local_report_never_claim_downloaded_pixels(self):
        result=json.loads((ROOT/'public/data/seasonal.json').read_text())
        if result['status']=='unavailable':
            self.assertEqual(result['assets'],{});self.assertIsNone(result['metrics'])
        radar=json.loads((ROOT/'public/data/analysis.json').read_text())
        masks=json.loads((ROOT/'public/data/radar-categories.json').read_text())
        self.assertEqual(sum(c['pixels'] for c in masks['categories']),radar['quality']['totalPixels'])

    def test_complete_classification_pipeline_on_temporary_test_fixtures(self):
        # Entirely synthetic test data; no fixture or metrics enter public project outputs.
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'public/data').mkdir(parents=True);(root/'processing').mkdir();(root/'inputs').mkdir()
            bounds=(90.95,25,90.952,25.002)
            (root/'public/data/analysis.json').write_text(json.dumps({'bounds':[[25,90.95],[25.002,90.952]]}))
            records=[]
            for season,day,data in [('dry','2026-01-15',[[1,0],[1,0]]),('wet','2026-08-15',[[1,1],[0,0]])]:
                path=root/'inputs'/f'{season}.tif'
                with rasterio.open(path,'w',driver='GTiff',height=2,width=2,count=1,dtype='uint8',nodata=255,crs='EPSG:4326',transform=from_bounds(*bounds,2,2)) as ds:
                    ds.write(np.array(data,dtype=np.uint8),1)
                records.append({'id':f'test-{season}','season':season,'date':day,'path':str(path.relative_to(root)),
                    'productType':'DSWx-HLS-WTR-v1','processingVersion':'1.1','mission':'Synthetic test fixture',
                    'productId':f'OPERA_L3_DSWx-HLS_TEST_{day.replace("-","")}T000000Z_v1.1','sourceUrl':'https://example.org/test-fixture'})
            manifest={'observations':records,'classificationPolicy':'Test-only WTR masks','methodSource':'https://example.org/test-fixture'}
            (root/'processing/seasonal-inputs.json').write_text(json.dumps(manifest))
            with patch.object(analyze_seasonal,'ROOT',root),patch.object(sys,'argv',['analyze_seasonal.py']):analyze_seasonal.main()
            report=json.loads((root/'public/data/seasonal.json').read_text())
            self.assertEqual(report['status'],'classified');self.assertEqual(len(report['metrics']['transitions']),4)
            self.assertIsNone(report['validation']['metrics'])
            self.assertAlmostEqual(sum(c['areaKm2'] for c in report['metrics']['transitions']),report['metrics']['comparedAreaKm2'])
            for asset in report['assets'].values():self.assertTrue((root/'public'/asset['url'].lstrip('/')).is_file())
            self.assertTrue((root/'data/derived/seasonal-dry.tif').is_file())


if __name__=='__main__':unittest.main()
