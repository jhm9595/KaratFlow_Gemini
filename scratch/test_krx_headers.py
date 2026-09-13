import urllib.request
from urllib.error import HTTPError

keys_to_test = {
    'Real Key in AUTH_KEY': ('AUTH_KEY', 'ADC20ED6167F4FB3878CCD2008E4E53733BA8876'),
    'Dummy Key in AUTH_KEY': ('AUTH_KEY', 'DUMMY12345'),
    'Real Key in auth-key': ('auth-key', 'ADC20ED6167F4FB3878CCD2008E4E53733BA8876'),
    'Real Key in Authorization': ('Authorization', 'Bearer ADC20ED6167F4FB3878CCD2008E4E53733BA8876')
}

url = 'https://data-dbg.krx.co.kr/svc/apis/gen/gold_bydd_trd?basDd=20240426'

for test_name, (header_key, header_val) in keys_to_test.items():
    req = urllib.request.Request(url, headers={header_key: header_val})
    try:
        resp = urllib.request.urlopen(req)
        print(f"[{test_name}] Success: {resp.read().decode('utf-8')[:50]}")
    except HTTPError as e:
        print(f"[{test_name}] HTTP {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"[{test_name}] Error: {e}")
