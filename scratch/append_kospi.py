import codecs

append_text = """
---

## 4. KOSPI 시리즈 일별시세정보 (KOSPI Market)
특정 일자의 코스피 및 관련 지수(KOSPI 200 등)의 일별 시세, 거래량, 시가총액 정보를 제공합니다. ('10년 01월 04일부터 데이터 제공)

* **Endpoint URL:** `/kospi_dd_trd`
* **요청(Request) 파라미터:**
  * `basDd` (String) : 기준일자 (예: "20260910")
* **주요 응답(Response) 필드:**
  * `BAS_DD` : 기준일자
  * `IDX_CLSS` : 계열구분
  * `IDX_NM` : 지수명 (예: 코스피, 코스피 200)
  * `CLSPRC_IDX` : 종가 (지수)
  * `CMPPREVDD_IDX` : 전일대비
  * `FLUC_RT` : 등락률
  * `OPNPRC_IDX` : 시가
  * `HGPRC_IDX` : 고가
  * `LWPRC_IDX` : 저가
  * `ACC_TRDVOL` : 거래량
  * `ACC_TRDVAL` : 거래대금
  * `MKTCAP` : 상장시가총액 (Market Cap)
"""

with codecs.open('docs/krx_api_spec.md', 'a', 'utf-8') as f:
    f.write(append_text)
print("Successfully appended KOSPI spec.")
