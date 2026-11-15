"""Download bounded official NASA GIBS daily optical browse images, not science rasters.
No authentication. At most 60 AOI images, 2 MB each; original radar assets unchanged.
"""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlencode
from datetime import datetime,timezone
import json,io,hashlib
import numpy as np
from PIL import Image
from rasterio.warp import transform_bounds
ROOT=Path(__file__).resolve().parents[2]
ENDPOINT='https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi'
LAYER='MODIS_Terra_CorrectedReflectance_TrueColor'

def main():
    base=json.loads((ROOT/'public/data/analysis.json').read_text())
    discovery=json.loads((ROOT/'public/data/seasonal-discovery.json').read_text())
    dates=sorted({c['start'][:10] for q in discovery['results'] for c in q['candidates'] if c.get('start')}|{base['beforeDate'],base['afterDate']}|{f'2026-{m:02d}-15' for m in range(1,12)})
    (south,west),(north,east)=base['bounds'];bbox=transform_bounds('EPSG:4326','EPSG:3857',west,south,east,north)
    width=512;height=round(width*(bbox[3]-bbox[1])/(bbox[2]-bbox[0]))
    output=ROOT/'public/data/display';output.mkdir(exist_ok=True)
    records=[];rejected=[]
    # Inspect the service's published time dimension; never silently request a nearest date.
    capabilities=ENDPOINT+'?'+urlencode({'SERVICE':'WMS','VERSION':'1.1.1','REQUEST':'GetCapabilities'})
    import xml.etree.ElementTree as ET
    with urlopen(Request(capabilities,headers={'User-Agent':'EarthPulse/1.0'}),timeout=25) as response:
        root=ET.fromstring(response.read(12_000_000))
    node=next(n for n in root.iter('Layer') if n.findtext('Name')==LAYER)
    time_extent=next(n.text for n in node if n.tag in ['Extent','Dimension'] and n.attrib.get('name')=='time' and n.text)
    def available(day):
        for span in time_extent.split(','):
            parts=span.split('/')
            if len(parts)==3 and parts[2]=='P1D' and parts[0][:10]<=day<=parts[1][:10]:return True
            if len(parts)==1 and parts[0][:10]==day:return True
        return False
    for day in dates[:60]:
        if not available(day):
            rejected.append({'date':day,'status':'Outside published daily availability'})
            continue
        params={'SERVICE':'WMS','VERSION':'1.1.1','REQUEST':'GetMap','LAYERS':LAYER,'STYLES':'','FORMAT':'image/png','TRANSPARENT':'TRUE','SRS':'EPSG:3857','BBOX':','.join(map(str,bbox)),'WIDTH':width,'HEIGHT':height,'TIME':day}
        url=ENDPOINT+'?'+urlencode(params)
        try:
            with urlopen(Request(url,headers={'User-Agent':'EarthPulse/1.0'}),timeout=25) as response:
                content=response.read(2_000_001)
            if len(content)>2_000_000:raise ValueError('Response exceeds size limit')
            image=Image.open(io.BytesIO(content)).convert('RGBA');pixels=np.asarray(image)
            if image.size!=(width,height) or not (pixels[:,:,3]>0).any():raise ValueError('Empty or wrong-size image')
            if np.unique(pixels.reshape(-1,4),axis=0).shape[0]<10:raise ValueError('Blank imagery')
            temp=output/f'gibs-{day}.webp';image.save(temp,'WEBP',quality=90,method=6)
            digest=hashlib.sha256(temp.read_bytes()).hexdigest()[:12];final=output/f'gibs-{day}-{digest}.webp';temp.replace(final)
            records.append({'id':'gibs-modis-'+day,'date':day,'sourceUrl':url,'layer':LAYER,'bounds':base['bounds'],
                'asset':{'url':'/data/display/'+final.name,'bytes':final.stat().st_size,'width':width,'height':height,'projection':'EPSG:3857','encoding':'WebP optical browse'},
                'nonTransparentPercent':float((pixels[:,:,3]>0).mean()*100)})
            print(day,'downloaded',flush=True)
        except Exception as error:
            rejected.append({'date':day,'status':'No usable public image retrieved','errorType':type(error).__name__})
            print(day,'unavailable',type(error).__name__,flush=True)
    report={'checkedAt':datetime.now(timezone.utc).isoformat(),'provider':'NASA GIBS','layer':LAYER,'timeExtent':time_extent,'capabilitiesUrl':capabilities,
            'method':'Daily MODIS Terra corrected-reflectance true-color browse images; display imagery only. No water classification or backscatter measurements. Clouds may obscure the ground; alpha coverage is not cloud-free coverage.','observations':records,'rejected':rejected}
    (ROOT/'public/data/public-imagery.json').write_text(json.dumps(report,indent=2)+'\n')

if __name__=='__main__':main()
