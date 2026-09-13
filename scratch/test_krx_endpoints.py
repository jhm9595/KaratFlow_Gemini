import urllib.request
from urllib.error import HTTPError

key = 'ADC20ED6167F4FB3878CCD2008E4E53733BA8876'
urls = [
    'https://data-dbg.krx.co.kr/svc/apis/gen/gold_bydd_trd?basDd=20240426',
    'https://data-dbg.krx.co.kr/svc/apis/gen/oil_bydd_trd?basDd=20240426',
    'https://data-dbg.krx.co.kr/svc/apis/idx/kospi_dd_trd?basDd=20240426'
]

for url in urls:
    req = urllib.request.Request(url, headers={'AUTH_KEY': key})
    try:
        resp = urllib.request.urlopen(req)
        print(f"[{url.split('/')[-1].split('?')[0]}] Success: {resp.read().decode('utf-8')[:50]}")
    except HTTPError as e:
        print(f"[{url.split('/')[-1].split('?')[0]}] HTTP {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"[{url.split('/')[-1].split('?')[0]}] Error: {e}")
