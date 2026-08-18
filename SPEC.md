# KaratFlow_Gemini Master Implementation Specification

## 1. Project Overview & Environment
- **Repository:** https://github.com/jhm9595/KaratFlow_Gemini.git
- **Backend Stack:** Java 17+, Spring Boot 3.x, Spring Data JPA, Spring Security (JWT), WebSocket (STOMP), Spring Batch / Task Scheduling, WebClient
- **Frontend Stack:** React 18+, TypeScript, Vite, Jotai, **PrimeReact (v10+)**, PrimeIcons, PrimeFlex (or TailwindCSS), @stomp/stompjs
- **Database:** PostgreSQL (or MySQL compatible standard DDL), Flyway/Liquibase
- **Deployment & Subdomain:** `karatflow.minibig.pw` (Nginx Reverse Proxy + Let's Encrypt SSL)

---

## 2. Core Business Domains & Security Architecture

### A. Multi-Tenant Ecosystem & Partner Handshake (보안 연계 및 사업자 검증)
- **Roles:**
  1. `VENDOR`: 총판 벤더 (다중 공장 발주 분배 및 통합 관제)
  2. `MANUFACTURER`: 메인 제조공장 (자체 공정 + 외주 발주 관리)
  3. `SUBCONTRACTOR`: 전문 외주처 (주물집, 조각집, 도금집)
- **국세청 사업자 진위확인 API:** 공공데이터포털(국세청_사업자등록정보 진위확인 API)을 연동하여 사업자번호, 대표자명, 개업일자 실시간 일치/계속사업자 여부 검증 (`BusinessVerificationService.java`).
- **3-Way Partner Handshake:**
  * 1회성 만료시간 초대 링크/QR 및 6자리 보안 PIN 발급.
  * 수락 시 `company_partnerships` 테이블에 매핑되어 상호 승인된 업체 간에만 작업 의뢰 및 금 수불 데이터 격리 노출.

### B. Subcontracting Workflow (외주 공정 관리 & 금 수불)
- 메인 공장에서 특정 작업지시서(`work_order`)의 공정(예: 도금)을 외주처로 발주.
- **감모(Loss) 추적:** 반출 실측 중량(`dispatched_weight_g`)과 가공 후 반입 중량(`received_weight_g`) 차이를 자동 계산하여 금 손실 분쟁 방지.
- 외주 작업 완료 시 외주 공임비(`agreed_labor_fee`)가 주문 정산서에 자동 합산.

### C. Dynamic Change Interlock & Real-time Alert (실시간 변경 통제)
- 메타데이터 기반 `ChangeTypeRules` (호수, 색상, 스톤, 각인 등).
- **공정 인터락:** `cutoff_stage` 초과 시 변경 차단, `free_stage` 초과 시 추가 공임 자동 부과.
- 변경 요청 시 작업지시서 즉시 `HOLD` 처리 및 WebSocket(`/topic/process-alerts`)으로 현장 태블릿 및 외주처에 PrimeReact `Toast` / `ConfirmDialog` 기반 실시간 경고 팝업.

### D. Stage-based Cancellation Fee Engine (공정별 취소 수수료)
- **CAD/Wax 취소:** 기본 CAD 모델링 공임 청구.
- **주물(Casting) 이후 취소:** (기투입 공임 80%) + [투입 금 중량 × 당일 금 시세 × 3%(정련 감모)] 부과 및 제품 실물을 `SCRAP_GOLD` 재고로 자동 입고.
- **도금/세공 중 취소:** 총 공임 + 기발생 외주비(도금비) 실비 + 스톤 분리 공임(알당 단가) + 금 정련비 합산.

### E. Invoicing & Daily Metal Price Settlement (최종 정산 계산서)
- **수식:**
  $$\text{순수 금 중량} = \text{완제품 실측 중량} - \text{스톤 중량}$$
  $$\text{정산 기준 중량} = \text{순수 금 중량} \times (1 + \frac{\text{해리율 \%}}{100})$$
  $$\text{금 금액} = \frac{\text{정산 기준 중량}}{3.75} \times \text{당일 금 시세(돈당)}$$
  $$\text{최종 청구액} = \text{금 금액} + \text{원청 공임} + \sum(\text{외주 공임}) + \text{추가/취소 공임} + \text{스톤비}$$
- 매일 오전 KRX/공공데이터 API 기반 당일 금 시세 스냅샷 자동 저장.

### F. Web-to-Print & PrimeReact UI Architecture
- **PrimeReact UI Components:**
  - **`DataTable` / `TreeTable`:** 실시간 주문/공정 관제 그리드 (정렬, 필터, 커스텀 상태 배지 템플릿, 반응형 스크롤).
  - **`Timeline` / `Steps`:** 제품별 공정 흐름 시각화 (`[설계] ➔ [주물] ➔ [세공] ➔ [도금외주] ➔ [검수]`).
  - **`Dialog` & Form Controls (`Dropdown`, `InputNumber`, `InputText`):** 메타데이터 JSON Schema 기반 동적 변경 요청 모달 및 파트너 초대 다이얼로그.
  - **`Toast` & `ConfirmDialog`:** WebSocket 연동 실시간 `HOLD` 긴급 알림 및 공정 취소 확인창.
- **Web-to-Print Templates:** 50×30mm 작업 봉투 라벨(열전사 프린터 CSS) 및 A4 거래명세표 원클릭 Direct Print.

---

## 3. Database Entities to Implement
`companies`, `company_partnerships`, `users`, `orders`, `order_items`, `designs`, `work_orders`, `subcontract_tasks`, `change_type_rules`, `order_change_requests`, `order_cancellations`, `daily_metal_prices`, `labor_fee_rules`, `weight_logs`, `invoices`.