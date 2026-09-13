import urllib.request
from urllib.error import HTTPError

key = 'ADC20ED6167F4FB3878CCD2008E4E53733BA8876'
req = urllib.request.Request('https://data.krx.co.kr/svc/apis/gen/gold_bydd_trd?basDd=20240426', headers={'AUTH_KEY': key})

try:
    resp = urllib.request.urlopen(req)
    print("Success:")
    print(resp.read().decode('utf-8'))
except HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Other Error:", e)
