# KRX 정보데이터시스템 API 연동 명세서

KaratFlow 대시보드에 사용되는 한국거래소(KRX)의 금 및 석유 시장 API 정보를 요약한 문서입니다.
매번 원본 가이드(Word 문서)를 열어볼 필요 없이 이 문서를 참고하여 개발 및 유지보수를 진행합니다.

## 1. 공통 사항 (Common)
* **Base URL:** `https://data-dbg.krx.co.kr/svc/apis/gen`
* **인증 방식:** `.env` 파일에 `KRX_API_KEY` 환경 변수로 발급받은 API 키를 등록하여 사용합니다. (HTTP 요청 헤더에 `AUTH_KEY`로 포함)
* **데이터 포맷:** JSON (응답은 `OutBlock_1` 배열 내부에 객체 형태로 반환됨)

---

## 2. 금시장 일별매매정보 (Gold Market)
특정 일자의 1kg 순금 및 100g 미니금 도매 거래 시세, 거래량 정보를 제공합니다. ('14년 03월 24일부터 데이터 제공)

* **Endpoint URL:** `/gold_bydd_trd`
* **요청(Request) 파라미터:**
  * `basDd` (String) : 기준일자 (예: "20260910")
* **주요 응답(Response) 필드:**
  * `BAS_DD` : 기준일자
  * `ISU_CD` : 종목코드 (예: 04020000)
  * `ISU_NM` : 종목명 (예: 금 99.99_1kg)
  * `TDD_CLSPRC` : 종가 (1g당 가격)
  * `TDD_OPNPRC` : 시가
  * `TDD_HGPRC` : 고가
  * `TDD_LWPRC` : 저가
  * `ACC_TRDVOL` : 거래량 (단위: g)
  * `ACC_TRDVAL` : 거래대금 (단위: 원)

---

## 3. 석유시장 일별매매정보 (Petroleum Market)
특정 일자의 휘발유, 경유, 등유에 대한 도매 가중평균가격 및 거래 정보를 제공합니다. ('12년 03월 30일부터 데이터 제공)

* **Endpoint URL:** `/oil_bydd_trd`
* **요청(Request) 파라미터:**
  * `basDd` (String) : 기준일자 (예: "20260910")
* **주요 응답(Response) 필드:**
  * `BAS_DD` : 기준일자
  * `OIL_NM` : 유종구분 (예: 휘발유, 경유, 등유)
  * `WT_AVG_PRC` : 가중평균가격_경쟁 (단위: ₩/L)
  * `WT_DIS_AVG_PRC` : 가중평균가격_협의 (단위: ₩/L)
  * `ACC_TRDVOL` : 거래량 (단위: L)
  * `ACC_TRDVAL` : 거래대금 (단위: 원)

---
> **💡 유지보수 팁:**
> 금 시세의 경우 응답받은 `TDD_CLSPRC`(1g 종가)에 `3.75`를 곱하여 1돈 시세로 변환해 대시보드에 표출하고 있습니다.
> 석유 시세의 경우 `WT_AVG_PRC`(경쟁매매 가격)를 최우선 지표로 활용하는 것을 권장합니다.

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
