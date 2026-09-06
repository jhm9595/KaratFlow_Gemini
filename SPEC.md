# KaratFlow_Gemini Master Implementation Specification

## 1. Project Overview & Environment
- **Repository:** https://github.com/jhm9595/KaratFlow_Gemini.git
- **Backend Stack:** Java 17+, Spring Boot 3.x, Spring Data JPA, Spring Security (OAuth2 Client + JWT), WebSocket (STOMP), Spring Batch / Task Scheduling, WebClient
- **Frontend Stack:** React 18+, TypeScript, Vite, Jotai, **PrimeReact (v10+ Styled Components)**, PrimeIcons, PrimeFlex (or TailwindCSS), @stomp/stompjs
  - **Component Reference:** https://primereact.dev/docs/styled/components/
- **Database:** PostgreSQL (Flyway DDL `V1__init_schema.sql`, Seed `V2__seed_rules.sql`)
- **Deployment & Subdomain:** `karatflow.minibig.pw` (Nginx Reverse Proxy + Let's Encrypt SSL)

---

## 2. Core Business Domains & Architecture

### A. Identifier & Key Strategy
- `orders.order_no`: 사람 친화적 비즈니스 주문번호 (예: `ORD-260829-001`).
- `orders.short_code`: 카카오톡 인앱 웹뷰 및 모바일 간편 조회를 위한 8자리 고유 보안 토큰.
- `work_orders.work_order_no`: 작업지시서 바코드 식별자.
- `companies.kakao_skill_api_key`: 업체별 개별 채널 연동을 위한 고유 API 키 (UUID/NanoID).

### B. Product Master Catalog & Item Candidate Approval Queue (품목 마스터 & 미매핑 승인 시스템)
- **Hierarchy:** `Brand (브랜드)` ➔ `Product (제품)` ➔ `Features/Variations (특징/옵션)`.
- **Composite Key & Uniqueness:** `(brand_name, product_name)` 기반 정합성 유지 및 전용 관리자 트리 뷰(`TreeTable`, `Tree`) 제공.
- **Flexible Order Ingestion:**
  - 주문 접수 시 `primary_image_url`(대표 이미지)과 자유 입력 품목명은 필수, 마스터 제품 매핑(`product_id`)은 선택(옵션).
  - 트리 탐색 팝업 및 `AutoComplete` 기반 기존 마스터 품목 검색/선택 지원.
- **Candidate Approval Queue (미매핑 품목 승인 큐):**
  - 마스터에 없는 신규 품목 주문 시 `is_mapped = FALSE` 상태로 후보 리스트에 자동 적재.
  - 관리자는 후보 리스트에서 `[기존 품목 매핑]` 또는 `[신규 품목 마스터 정식 승인/등록]` 원클릭 처리.

### C. KakaoTalk Skill Webhook Architecture (Unified & Multi-Tenant Dual Support)
- **Dual Routing Endpoints (`KakaoBotController.java` & `KakaoBotService.java`):**
  1. **[Mode 1 - Unified KaratFlow Channel]:**
     - `POST /api/kakao/skill/order-status`: 주문/공정 진행 상황 및 품목 건수 조회
     - `POST /api/kakao/skill/product-search`: 브랜드/제품 키워드 기반 카탈로그 조회 및 카드 표출
     - `POST /api/kakao/skill/change-request`: 카톡 챗봇 내 실시간 변경 접수 및 인터락 판정
     - `POST /api/kakao/skill/cancel-request`: 공정별 취소 수수료 사전 계산 및 취소 승인
     - `POST /api/kakao/skill/process-step`: 외주처/현장 실측 중량 입력 및 공정 완료
     - *Resolution:* 주문번호(`order_no`) 및 8자리 보안 토큰(`short_code`) 기반으로 소속 테넌트(`company_id`)를 동적 식별하여 카드 응답.
  2. **[Mode 2 - White-label Dedicated Tenant Channels]:**
     - `POST /api/kakao/skill/{companyApiKey}/**` (상동 엔드포인트 세트)
     - *Resolution:* URL 경로의 `companyApiKey`를 기반으로 `companies` 테이블을 조회하여 해당 공장 전용 테넌트 컨텍스트를 자동 바인딩.
- **WebSocket STOMP Integration:**
  - 어떤 모드로 요청이 들어오든 주문 변경/취소/완료 이벤트 발생 시 내부 서비스(`OrderChangeService`, `CancellationService`)를 실행하고 `/topic/process-alerts`로 실시간 브로드캐스트.

### D. APM-Style Real-Time Monitoring Dashboard (제니퍼 스타일 관제 & 그리드)
- **Top KPI Metrics:** 당일 총 주문수, 공정별 진행수, 외주 반출 현황, 긴급 HOLD 건수 (PrimeReact `Card` + `Badge`).
- **Grid View Enhancements:**
  - **대표 이미지 컬럼:** PrimeReact `Image` 컴포넌트 적용 (호버/클릭 시 줌 미리보기).
  - **주문별 품목 건수:** 주문 번호별 포함된 총 품목 수량 배지 표출 (예: `3건`).
  - **HOLD Visual Pulse:** 카톡/웹에서 변경/취소 유입 시 STOMP WebSocket 연동으로 해당 Row에 빨간색 펄스 애니메이션(`p-highlight-pulse-danger`) 즉시 적용 및 최상단 고정.
- **Topology & Equalizer:** 공정별 체류량 노드 뷰 및 PrimeReact `Chart` 기반 실시간 공정 부하 바 차트.

### E. Social OAuth2 Authentication (Kakao REST API & Google)
- **Kakao REST API:** `https://kauth.kakao.com/oauth/authorize`, `https://kapi.kakao.com/v2/user/me` (`KakaoOAuth2UserInfo.java`).
- **Google Login:** OpenID Connect 표준 연동.
- **Security Handler Flow:** 자체 JWT 발급 후 미등록 사업자는 `/onboarding` (국세청 사업자 진위확인 또는 파트너 초대 PIN 입력)으로 라우팅.

### F. Multi-Tenant Ecosystem & Partner Handshake
- **Roles:** `VENDOR` (총판 벤더), `MANUFACTURER` (메인 제조공장), `SUBCONTRACTOR` (전문 외주처 - 주물/조각/도금/레이저).
- **국세청 사업자 진위확인 API:** 공공데이터포털 연동으로 사업자번호, 대표자명, 개업일자 실시간 일치/계속사업자 여부 검증 (`BusinessVerificationService.java`).
- **3-Way Partner Handshake:** 만료형 초대 링크/QR 및 6자리 PIN 인증을 통해 `company_partnerships` 매핑 후 외주 데이터 격리 접근.

### G. Dynamic Process Routing & Templates (동적 공정 템플릿)
- `process_templates` 및 `process_template_steps` 마스터를 기반으로 `work_order_steps` 동적 생성.
- **기본 프리셋:**
  1. `TEMPLATE_CASTING_STANDARD`: CAD ➔ 왁스트리 ➔ 주물 ➔ 세공 ➔ (각인) ➔ 도금 ➔ 검수
  2. `TEMPLATE_HANDMADE`: 원자재불출(금괴) ➔ 손세공/땜 ➔ 조각 ➔ (각인) ➔ 도금 ➔ 검수 (왁스트리/주물 Bypass)
  3. `TEMPLATE_REPAIR_RESIZE`: 입고실측 ➔ 절단/호수땜 ➔ 세공/도금 ➔ 검수
- 주문별 공정 단계 추가, 삭제, 스킵 및 외주 여부 개별 지정 지원.

### H. Engraving & Surface Finishing Control (각인 및 표면 마감)
- `order_items` 확장: `engraving_text`, `engraving_font`, `engraving_location` (안바닥/겉면), `surface_finish` (유광/무광/헤어라인/스타더스트 등).
- 각인 문구 존재 시 도금 전 `ENGRAVING` 공정 자동 삽입.
- 50×30mm 작업 봉투 라벨 최상단 볼드 강조 인쇄 및 각인 완료 후 취소 불가 인터락 적용.

### I. Dual Order Channels (B2B Wholesale vs B2C Consumer)
- `orders.order_type` (`B2B` vs `B2C`) 분기:
  - **B2B:** `placed_by_company_id` 필수, 금 실측 중량 × 당일 시세 × 해리율 + 원청/외주 세부 공임 분리 거래명세표(A4) 출력.
  - **B2C:** `customer_name`, `customer_phone`, `final_consumer_price` 입력, 소비자용 품질보증서 겸 영수증(A5/A4) 출력.
- 물리적 제조 공정 파이프라인 및 변경 인터락(HOLD) 엔진은 동일 공유.

### J. Subcontracting Workflow & Scrap Loss Tracking
- 메인 공장에서 `work_order_steps`의 특정 공정을 외주처(`to_company_id`)로 발주.
- **감모(Loss) 추적:** 반출 실측 중량(`dispatched_weight_g`) vs 반입 중량(`received_weight_g`) 자동 계산.
- 외주 작업 완료 시 외주 공임비(`agreed_labor_fee`)가 주문 정산서에 자동 누적.

### K. Dynamic Change Interlock & Stage-based Cancellation Fee Engine
- 메타데이터 기반 `ChangeTypeRules` (호수, 색상, 스톤, 각인 등): 컷오프 단계 초과 시 차단, 변경 시 즉시 `HOLD` 처리 및 WebSocket 알림.
- **취소 수수료 엔진:** CAD비 ➔ 주물 후 금 정련비(3% 감모) + 기투입 공임 80% (`SCRAP_GOLD` 재고 입고) ➔ 도금/각인 후 외주비 전액 및 위약금 정산.

### L. Invoicing & Daily Metal Price Settlement
- **정산 수식:**
  $$\text{순수 금 중량} = \text{완제품 실측 중량} - \text{스톤 중량}$$
  $$\text{정산 기준 중량} = \text{순수 금 중량} \times (1 + \frac{\text{해리율 \%}}{100})$$
  $$\text{금 금액} = \frac{\text{정산 기준 중량}}{3.75} \times \text{당일 금 시세(돈당)}$$
  $$\text{최종 청구액} = \text{금 금액} + \text{원청 공임} + \sum(\text{외주 공임}) + \text{추가/취소 공임} + \text{스톤비}$$
- 매일 오전 KRX/공공데이터 API 스케줄러로 당일 금 시세 스냅샷 자동 저장.

---

## 3. PrimeReact Full Component Architecture (UI Spec)
- **품목 카탈로그 & 계층 트리:** `TreeTable`, `Tree` (브랜드-제품 계층 관리), `Image` (대표 이미지 썸네일/줌 뷰).
- **관제 모니터링:** `DataTable` (대표 이미지 썸네일, 품목 건수 배지, 글로벌 필터, 다중 정렬, `rowExpansion`, `paginator`, `rows={10}`).
- **입력 폼 & 승인 모달:** `AutoComplete` (거래처/품목 검색), `MultiSelect`, `Dropdown`, `SelectButton` (B2B/B2C 토글), `InputNumber` (소수점 3자리 중량/금액), `InputSwitch`, `FileUpload` (대표 이미지 및 CAD 파일), `Dialog` (미매핑 품목 승인 모달).
- **공정 시각화 & 게이지:** `Timeline` (동적 `work_order_steps` 흐름), `Steps` (주문/온보딩 마법사), `ProgressBar`, `Chart` (공정 부하 이퀄라이저).
- **오버레이 & 피드백:** `Toast` & `ConfirmDialog` (STOMP WebSocket 연동 실시간 HOLD 알림), `SpeedDial` / `SplitButton`.
- **인쇄 템플릿:** 50×30mm 열전사 라벨 CSS & A4 거래명세표/품질보증서 Direct Print.

---

## 4. Comprehensive Engineering Standards & Implementation Rules

### A. Java 17 & Spring Boot 3
- Lombok `@Data` 금지: `@Getter`, `@NoArgsConstructor(access = PROTECTED)`, `@Builder`만 사용.
- 모든 연관관계는 `fetch = FetchType.LAZY` 강제.
- Controller에서 Entity 직접 노출 금지 (Java 17 `record` DTO 사용).
- `ApiResponse<T>` 통일 및 `@RestControllerAdvice` 전역 예외 처리.
- Service 상단 `@Transactional(readOnly = true)` 기본 선언, CUD 메서드에만 `@Transactional` 적용.

### B. React 18, TypeScript & PrimeReact
- `any` 타입 및 `as` 단언 금지 (엄격한 인터페이스 정의).
- `style={{ ... }}` 인라인 스타일 금지 -> PrimeFlex 클래스 및 테마 변수 활용.
- 네이티브 HTML 대신 PrimeReact 컴포넌트 100% 활용.
- Custom Hook 분리: 복잡한 useEffect, 비즈니스 계산, API 호출은 뷰에서 분리.

### C. Styling & Layout Rules
- 인라인 스타일링 엄격 금지: **PrimeFlex 유틸리티 클래스** 또는 테마 CSS 변수(`var(--...)`) 활용.
- 반응형 3단 브레이크포인트: 카카오 웹뷰(`col-12`), 현장 태블릿(`col-12 md:col-6`), 관제 데스크톱(`col-12 md:col-6 lg:col-4`).
- Web-to-Print 독립 CSS 격리 (`.print-label-thermal`, `.print-invoice-a4`).

---

## 5. Database Entities to Implement
`companies`, `company_partnerships`, `users`, `products`, `product_features`, `orders`, `order_items`, `process_templates`, `process_template_steps`, `work_orders`, `work_order_steps`, `subcontract_tasks`, `change_type_rules`, `order_change_requests`, `order_cancellations`, `daily_metal_prices`, `labor_fee_rules`, `weight_logs`, `invoices`.