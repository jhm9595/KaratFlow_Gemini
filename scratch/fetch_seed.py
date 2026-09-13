import urllib.request
import json
import time
from datetime import datetime, timedelta

key = 'ADC20ED6167F4FB3878CCD2008E4E53733BA8876'
start_date = datetime(2026, 9, 1)
end_date = datetime(2026, 9, 12)

oil_data = []
kospi_data = []

current_date = start_date
while current_date <= end_date:
    date_str = current_date.strftime('%Y%m%d')
    date_formatted = f"LocalDate.of({current_date.year}, {current_date.month}, {current_date.day})"
    
    # Fetch Oil
    req = urllib.request.Request(f'https://data-dbg.krx.co.kr/svc/apis/gen/oil_bydd_trd?basDd={date_str}', headers={'AUTH_KEY': key})
    try:
        resp = urllib.request.urlopen(req)
        items = json.loads(resp.read().decode())['OutBlock_1']
        if items:
            gasoline = next((float(x['WT_AVG_PRC'].replace(',', '')) for x in items if x['OIL_NM'] == '휘발유' or '휘발유' in x.get('OIL_NM_ENG', '') or x['OIL_NM'].startswith('휘') or x['OIL_NM'] == 'ֹ' or '휘' in repr(x['OIL_NM'])), 0.0)
            diesel = next((float(x['WT_AVG_PRC'].replace(',', '')) for x in items if x['OIL_NM'] == '경유' or x['OIL_NM'].startswith('경') or x['OIL_NM'] == '' or '경' in repr(x['OIL_NM'])), 0.0)
            kerosene = next((float(x['WT_AVG_PRC'].replace(',', '')) for x in items if x['OIL_NM'] == '등유' or x['OIL_NM'].startswith('등') or x['OIL_NM'] == '' or '등' in repr(x['OIL_NM'])), 0.0)
            
            # Since encoding is mangled, I'll fallback to index 0,1,2 based on ACC_TRDVOL usually Gasoline, Diesel, Kerosene
            if gasoline == 0.0 and len(items) >= 3:
                # Based on previous output, items[0] is gasoline, items[1] is diesel, items[2] is kerosene
                gasoline = float(items[0]['WT_AVG_PRC'].replace(',', ''))
                diesel = float(items[1]['WT_AVG_PRC'].replace(',', ''))
                kerosene = float(items[2]['WT_AVG_PRC'].replace(',', ''))
            oil_data.append(f"{{{date_formatted}, {gasoline}, {diesel}, {kerosene}}}")
        else:
            oil_data.append(f"{{{date_formatted}, 0.0, 0.0, 0.0}}")
    except Exception as e:
        oil_data.append(f"{{{date_formatted}, 0.0, 0.0, 0.0}}")

    # Fetch Kospi
    req = urllib.request.Request(f'https://data-dbg.krx.co.kr/svc/apis/idx/kospi_dd_trd?basDd={date_str}', headers={'AUTH_KEY': key})
    try:
        resp = urllib.request.urlopen(req)
        items = json.loads(resp.read().decode())['OutBlock_1']
        if items:
            kospi = next((float(x['CLSPRC_IDX'].replace(',', '')) for x in items if x['IDX_NM'] == '코스피' or x['IDX_NM'] == 'ڽ'), 0.0)
            kospi200 = next((float(x['CLSPRC_IDX'].replace(',', '')) for x in items if x['IDX_NM'] == '코스피 200' or x['IDX_NM'] == 'ڽ 200'), 0.0)
            val = next((int(x['ACC_TRDVAL'].replace(',', '')) for x in items if x['IDX_NM'] == '코스피' or x['IDX_NM'] == 'ڽ'), 0)
            kospi_data.append(f"{{{date_formatted}, {kospi}, {kospi200}, {val}L}}")
        else:
            kospi_data.append(f"{{{date_formatted}, 0.0, 0.0, 0L}}")
    except Exception as e:
        kospi_data.append(f"{{{date_formatted}, 0.0, 0.0, 0L}}")
        
    current_date += timedelta(days=1)
    time.sleep(0.1)

print("OIL:")
print(",\n".join(oil_data))
print("KOSPI:")
print(",\n".join(kospi_data))
