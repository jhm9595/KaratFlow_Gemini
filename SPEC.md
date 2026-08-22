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
- `orders.order_no`: 사람 친화적 비즈니스 주문번호 (예: `ORD-260822-001`).
- `orders.short_code`: 카카오톡 인앱 웹뷰 및 모바일 간편 조회를 위한 8자리 고유 보안 토큰.
- `work_orders.work_order_no`: 작업지시서 바코드 식별자.

### B. Social OAuth2 Authentication (Kakao REST API & Google)
- **Kakao REST API:** `https://kauth.kakao.com/oauth/authorize`, `https://kapi.kakao.com/v2/user/me` (`KakaoOAuth2UserInfo.java`).
- **Google Login:** OpenID Connect 표준 연동.
- **Security Handler Flow:** 자체 JWT 발급 후 미등록 사업자는 `/onboarding` (국세청 사업자 진위확인 또는 파트너 초대 PIN 입력)으로 라우팅.

### C. KakaoTalk Skill Webhook & Mobile Webview
- `KakaoBotController.java` & `KakaoBotService.java`: 카카오 i 오픈빌더 스킬 Webhook 규격 구현.
  - `POST /api/kakao/skill/order-status`: 주문/공정 진행 상황 조회
  - `POST /api/kakao/skill/change-request`: 카톡 챗봇 내 실시간 변경 접수 및 인터락 판정
  - `POST /api/kakao/skill/cancel-request`: 공정별 취소 수수료 사전 계산 및 취소 승인
  - `POST /api/kakao/skill/process-step`: 외주처/현장 실측 중량 입력 및 공정 완료
- 카톡 이벤트 발생 시 내부 서비스(`OrderChangeService`, `CancellationService`) 호출 후 WebSocket STOMP (`/topic/process-alerts`) 브로드캐스트.

### D. Multi-Tenant Ecosystem & Partner Handshake
- **Roles:** `VENDOR` (총판 벤더), `MANUFACTURER` (메인 제조공장), `SUBCONTRACTOR` (전문 외주처 - 주물/조각/도금/레이저).
- **국세청 사업자 진위확인 API:** 공공데이터포털 연동으로 사업자번호, 대표자명, 개업일자 실시간 일치/계속사업자 여부 검증 (`BusinessVerificationService.java`).
- **3-Way Partner Handshake:** 만료형 초대 링크/QR 및 6자리 PIN 인증을 통해 `company_partnerships` 매핑 후 외주 데이터 격리 접근.

### E. Dynamic Process Routing & Templates (동적 공정 템플릿)
- `process_templates` 및 `process_template_steps` 마스터를 기반으로 `work_order_steps` 동적 생성.
- **기본 프리셋:**
  1. `TEMPLATE_CASTING_STANDARD`: CAD ➔ 왁스트리 ➔ 주물 ➔ 세공 ➔ (각인) ➔ 도금 ➔ 검수
  2. `TEMPLATE_HANDMADE`: 원자재불출(금괴) ➔ 손세공/땜 ➔ 조각 ➔ (각인) ➔ 도금 ➔ 검수 (왁스트리/주물 Bypass)
  3. `TEMPLATE_REPAIR_RESIZE`: 입고실측 ➔ 절단/호수땜 ➔ 세공/도금 ➔ 검수
- 주문별 공정 단계 추가, 삭제, 스킵 및 외주 여부 개별 지정 지원.

### F. Engraving & Surface Finishing Control (각인 및 표면 마감)
- `order_items` 확장: `engraving_text`, `engraving_font`, `engraving_location` (안바닥/겉면), `surface_finish` (유광/무광/헤어라인/스타더스트 등).
- 각인 문구 존재 시 도금 전 `ENGRAVING` 공정 자동 삽입.
- 50×30mm 작업 봉투 라벨 최상단 볼드 강조 인쇄 및 각인 완료 후 취소 불가 인터락 적용.

### G. Dual Order Channels (B2B Wholesale vs B2C Consumer)
- `orders.order_type` (`B2B` vs `B2C`) 분기:
  - **B2B:** `placed_by_company_id` 필수, 금 실측 중량 × 당일 시세 × 해리율 + 원청/외주 세부 공임 분리 거래명세표(A4) 출력.
  - **B2C:** `customer_name`, `customer_phone`, `final_consumer_price` 입력, 소비자용 품질보증서 겸 영수증(A5/A4) 출력.
- 물리적 제조 공정 파이프라인 및 변경 인터락(HOLD) 엔진은 동일 공유.

### H. Subcontracting Workflow & Scrap Loss Tracking
- 메인 공장에서 `work_order_steps`의 특정 공정을 외주처(`to_company_id`)로 발주.
- **감모(Loss) 추적:** 반출 실측 중량(`dispatched_weight_g`) vs 반입 중량(`received_weight_g`) 자동 계산.
- 외주 작업 완료 시 외주 공임비(`agreed_labor_fee`)가 주문 정산서에 자동 누적.

### I. Dynamic Change Interlock & Stage-based Cancellation Fee Engine
- 메타데이터 기반 `ChangeTypeRules` (호수, 색상, 스톤, 각인 등): 컷오프 단계 초과 시 차단, 변경 시 즉시 `HOLD` 처리 및 WebSocket 알림.
- **취소 수수료 엔진:** CAD비 ➔ 주물 후 금 정련비(3% 감모) + 기투입 공임 80% (`SCRAP_GOLD` 재고 입고) ➔ 도금/각인 후 외주비 전액 및 위약금 정산.

### J. Invoicing & Daily Metal Price Settlement
- **정산 수식:**
  $$\text{순수 금 중량} = \text{완제품 실측 중량} - \text{스톤 중량}$$
  $$\text{정산 기준 중량} = \text{순수 금 중량} \times (1 + \frac{\text{해리율 \%}}{100})$$
  $$\text{금 금액} = \frac{\text{정산 기준 중량}}{3.75} \times \text{당일 금 시세(돈당)}$$
  $$\text{최종 청구액} = \text{금 금액} + \text{원청 공임} + \sum(\text{외주 공임}) + \text{추가/취소 공임} + \text{스톤비}$$
- 매일 오전 KRX/공공데이터 API 스케줄러로 당일 금 시세 스냅샷 자동 저장.

---

## 3. PrimeReact Full Component Architecture (UI Spec)
- **데이터 그리드:** `DataTable` & `TreeTable` (다중 정렬, 글로벌 필터, 커스텀 바디 템플릿, `rowExpansion`, `paginator`, `rows={10}`).
- **상태/배지:** `Tag` & `Badge` (`severity="success" | "warning" | "danger" | "info"`).
- **입력 폼:** `AutoComplete` (거래처/스톤 자동완성), `MultiSelect`, `Dropdown`, `SelectButton` (B2B/B2C 토글), `InputNumber` (소수점 3자리 중량/금액), `InputSwitch`, `FileUpload` (CAD 3D 파일).
- **공정 시각화:** `Timeline` (동적 `work_order_steps` 흐름), `Steps` (주문/온보딩 마법사), `ProgressBar`.
- **오버레이 & 피드백:** `Dialog`, `Sidebar`, `Toast` & `ConfirmDialog` (STOMP WebSocket 연동 실시간 HOLD 알림), `SpeedDial` / `SplitButton`.
- **인쇄 템플릿:** 50×30mm 열전사 라벨 CSS & A4 거래명세표/품질보증서 Direct Print.

---

## 4. Engineering Standards & Implementation Rules

### A. Java 17 & Spring Boot 3
- Lombok `@Data` 금지: `@Getter`, `@NoArgsConstructor(access = PROTECTED)`, `@Builder`만 사용.
- 모든 연관관계는 `fetch = FetchType.LAZY` 강제.
- Controller에서 Entity 직접 노출 금지, Java 17 `record` 기반 DTO 사용.
- `ApiResponse<T>` 통일 및 `@RestControllerAdvice` 예외 처리.
- Service 상단 `@Transactional(readOnly = true)` 기본 선언, CUD 메서드에만 `@Transactional` 적용.

### B. React 18, TypeScript & PrimeReact
- `any` 타입 및 `as` 단언 금지 (엄격한 인터페이스 정의).
- `style={{ ... }}` 인라인 스타일 금지 -> PrimeFlex 클래스 및 테마 변수 활용.
- 네이티브 HTML 대신 PrimeReact 컴포넌트 100% 활용.
- Custom Hook 분리: 복잡한 useEffect, 비즈니스 계산, API 호출은 뷰에서 분리.

---

## 5. Database Entities to Implement
`companies`, `company_partnerships`, `users`, `orders`, `order_items`, `designs`, `process_templates`, `process_template_steps`, `work_orders`, `work_order_steps`, `subcontract_tasks`, `change_type_rules`, `order_change_requests`, `order_cancellations`, `daily_metal_prices`, `labor_fee_rules`, `weight_logs`, `invoices`.