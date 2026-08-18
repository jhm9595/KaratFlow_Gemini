import os

# 1. Create i18n.ts
i18n_path = 'frontend/src/i18n.ts'
i18n_content = '''import i18n from 'i18next';
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
'''
with open(i18n_path, 'w', encoding='utf-8') as f:
    f.write(i18n_content)

# 2. Modify main.tsx to import i18n
main_path = 'frontend/src/main.tsx'
with open(main_path, 'r', encoding='utf-8') as f:
    main_content = f.read()

if "import './i18n';" not in main_content:
    main_content = main_content.replace('import App from "./App";', 'import "./i18n";\nimport App from "./App";')
    with open(main_path, 'w', encoding='utf-8') as f:
        f.write(main_content)

# 3. Rewrite App.tsx
app_path = 'frontend/src/App.tsx'
app_content = '''import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';

function App() {
    const { t, i18n } = useTranslation();
    const toast = useRef<any>(null);
    const [changeModalVisible, setChangeModalVisible] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [partnerModalVisible, setPartnerModalVisible] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8888/api/orders')
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error('Error fetching orders:', err));
    }, []);

    const mockTimeline = [
        { status: t('stage_cad'), date: '10:00' },
        { status: t('stage_casting'), date: '12:00' },
        { status: t('stage_polishing'), date: '15:00' },
        { status: t('stage_plating'), date: t('pending') },
        { status: t('stage_inspection'), date: t('pending') }
    ];

    const showHoldAlert = () => {
        toast.current?.show({ severity: 'warn', summary: t('alert_title'), detail: t('alert_desc'), life: 3000 });
    };

    const statusBodyTemplate = (rowData: any) => {
        const badgeClass = rowData.isHold ? 'p-badge-danger' : 'p-badge-success';
        return <span className={"p-badge " + badgeClass}>{rowData.isHold ? t('hold') : rowData.stage}</span>;
    };

    const toggleLanguage = () => {
        const nextLang = i18n.language.startsWith('ko') ? 'en' : 'ko';
        i18n.changeLanguage(nextLang);
    };

    return (
        <div className="p-m-4 p-4">
            <Toast ref={toast} />
            <div className="flex justify-content-between align-items-center mb-4">
                <h2>{t('title')}</h2>
                <div>
                    <Button label={t('lang')} icon="pi pi-globe" className="p-button-secondary p-button-outlined mr-2" onClick={toggleLanguage} />
                    <Button label={t('invite_partner')} icon="pi pi-users" className="p-button-info mr-2" onClick={() => setPartnerModalVisible(true)} />
                    <Button label={t('simulate_hold')} icon="pi pi-bell" className="p-button-warning" onClick={showHoldAlert} />
                </div>
            </div>

            <div className="grid">
                <div className="col-12 md:col-8">
                    {/* @ts-ignore */}
                    <Card title={t('active_orders')}>
                        {/* @ts-ignore */}
                        <DataTable value={orders} responsiveLayout="scroll">
                            <Column field="id" header={t('order_id')}></Column>
                            <Column field="design" header={t('design')}></Column>
                            <Column field="date" header={t('date')}></Column>
                            <Column field="stage" header={t('status')} body={statusBodyTemplate}></Column>
                            <Column body={() => <Button icon="pi pi-pencil" onClick={() => setChangeModalVisible(true)} className="p-button-rounded p-button-text" />} />
                        </DataTable>
                    </Card>
                </div>
                
                <div className="col-12 md:col-4">
                    {/* @ts-ignore */}
                    <Card title={t('pipeline')}>
                        {/* @ts-ignore */}
                        <Timeline value={mockTimeline} content={(item: any) => item.status} opposite={(item: any) => item.date} />
                    </Card>
                </div>
            </div>

            {/* @ts-ignore */}
            <Dialog header={t('change_request')} visible={changeModalVisible} style={{ width: '50vw' }} onHide={() => setChangeModalVisible(false)}>
                <p className="m-0" dangerouslySetInnerHTML={{ __html: t('change_desc') }}></p>
                <div className="flex justify-content-end mt-4">
                    <Button label={t('cancel')} icon="pi pi-times" onClick={() => setChangeModalVisible(false)} className="p-button-text" />
                    <Button label={t('submit')} icon="pi pi-check" onClick={() => { setChangeModalVisible(false); showHoldAlert(); }} autoFocus />
                </div>
            </Dialog>

            {/* @ts-ignore */}
            <Dialog header={t('handshake')} visible={partnerModalVisible} style={{ width: '50vw' }} onHide={() => setPartnerModalVisible(false)}>
                <p className="m-0 mb-3">{t('handshake_desc')}</p>
                <div className="flex justify-content-end mt-4">
                    <Button label={t('verify')} icon="pi pi-check" onClick={() => { setPartnerModalVisible(false); toast.current?.show({ severity: 'success', summary: t('success'), detail: t('verify_success'), life: 3000 }); }} autoFocus />
                </div>
            </Dialog>

        </div>
    );
}

export default App;
'''
with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

print("i18n successfully configured.")
