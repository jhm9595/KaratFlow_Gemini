import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "title": "KaratFlow Gemini - Dashboard",
      "invite_partner": "Invite Partner",
      "simulate_hold": "Simulate HOLD Alert",
      "active_orders": "Active Work Orders",
      "order_id": "Order ID",
      "design": "Design",
      "date": "Date",
      "status": "Status",
      "pipeline": "Process Pipeline (Order #2)",
      "change_request": "Request Order Change",
      "change_desc": "Select change type (Ring Size, Color, Engraving).<br/><b>Warning:</b> Cutoff stage rules will apply automatically.",
      "cancel": "Cancel",
      "submit": "Submit Change",
      "handshake": "Partner Handshake & Verification",
      "handshake_desc": "Verify business via NTS API and generate a 6-digit secure PIN for a 3-way handshake.",
      "verify": "Verify & Invite",
      "alert_title": "HOLD Alert",
      "alert_desc": "WorkOrder #2 is on HOLD due to change request.",
      "verify_success": "Partner verified and PIN generated.",
      "success": "Success",
      "hold": "HOLD",
      "stage_cad": "CAD",
      "stage_casting": "CASTING",
      "stage_polishing": "POLISHING",
      "stage_plating": "PLATING",
      "stage_inspection": "INSPECTION",
      "pending": "Pending",
      "surface_finish": "Finish",
      "engraving": "Engraving",
      "lang": "English"
    }
  },
  ko: {
    translation: {
      "title": "KaratFlow Gemini - 통합 모니터링 대시보드",
      "invite_partner": "협력사 초대",
      "simulate_hold": "보류 알림 시뮬레이션",
      "active_orders": "진행 중인 작업지시서",
      "order_id": "주문 번호",
      "design": "디자인",
      "date": "주문 일자",
      "status": "현재 상태",
      "pipeline": "실시간 공정 파이프라인 (주문 #2)",
      "change_request": "주문 변경 요청",
      "change_desc": "변경 항목(반지 호수, 색상, 각인 문구 등)을 선택해 주세요.<br/><b>주의:</b> 현재 공정 단계(Cutoff)에 따라 변경이 불가능할 수 있으며, 변경 승인 시 관련 작업지시서가 자동으로 HOLD 처리됩니다.",
      "cancel": "취소",
      "submit": "변경 요청 접수",
      "handshake": "협력사 인증 및 초대 (3-Way Handshake)",
      "handshake_desc": "국세청 NTS API를 통해 사업자 진위를 확인하고, 안전한 데이터 연동을 위한 6자리 보안 PIN 코드를 생성합니다.",
      "verify": "사업자 인증 및 초대 발송",
      "alert_title": "보류(HOLD) 알림",
      "alert_desc": "작업지시서 #2가 주문 변경 요청으로 인해 보류 상태로 전환되었습니다.",
      "verify_success": "협력사 인증이 완료되었으며 보안 PIN 코드가 발급되었습니다.",
      "success": "인증 성공",
      "hold": "보류됨",
      "stage_cad": "캐드(CAD)",
      "stage_casting": "주조(CASTING)",
      "stage_polishing": "광택(POLISHING)",
      "stage_plating": "도금(PLATING)",
      "stage_inspection": "검수(INSPECTION)",
      "pending": "대기 중",
      "surface_finish": "표면마감",
      "engraving": "각인정보",
      "lang": "한국어"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
