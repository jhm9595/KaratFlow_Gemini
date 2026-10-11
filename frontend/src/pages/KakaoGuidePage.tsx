import React, { useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';

export const KakaoGuidePage: React.FC<{ companyId?: number }> = ({ companyId = 101 }) => {
    const toast = useRef<Toast>(null);
    const webhookUrl = `${window.location.protocol}//${window.location.host}/api/kakao/skill/v1/companies/${companyId}/create-order`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(webhookUrl);
        toast.current?.show({ 
            severity: 'success', 
            summary: '복사 완료', 
            detail: '공장 전용 Webhook URL이 클립보드에 복사되었습니다!', 
            life: 3000 
        });
    };

    return (
        <div className="p-4 surface-ground min-h-screen">
            <Toast ref={toast} />
            <div className="flex align-items-center justify-content-between mb-4">
                <h2 className="text-900 font-bold m-0 flex align-items-center gap-2">
                    <i className="pi pi-comments text-yellow-600 text-2xl"></i>
                    카카오톡 채널 & 챗봇 연동 가이드
                </h2>
                <span className="text-500 text-sm">공장 ID: #{companyId}</span>
            </div>

            {/* URL Copy Card */}
            <Card className="mb-4 border-round-xl shadow-2 border-1 border-yellow-300 bg-yellow-50">
                <h3 className="m-0 text-yellow-900 font-bold text-lg mb-2">🔗 내 공장 전용 챗봇 Webhook URL</h3>
                <p className="text-yellow-800 text-sm mb-3">
                    카카오 i 오픈빌더 스킬 설정 시 아래 URL을 복사하여 [스킬 URL] 항목에 붙여넣으세요.
                </p>
                <div className="flex align-items-center gap-2 bg-white p-3 border-round-lg border-1 border-yellow-300 shadow-1">
                    <input 
                        type="text" 
                        readOnly 
                        value={webhookUrl} 
                        className="p-inputtext flex-1 font-mono text-sm border-none bg-transparent text-900 font-bold" 
                    />
                    <Button 
                        label="URL 복사" 
                        icon="pi pi-copy" 
                        className="p-button-warning p-button-sm shadow-1 font-bold" 
                        onClick={copyToClipboard} 
                    />
                </div>
            </Card>

            {/* Step-by-Step Instructions */}
            <div className="grid">
                <div className="col-12 md:col-4">
                    <Card title="1단계: 카카오 채널 개설" subTitle="카카오톡 채널 관리자 센터" className="h-full border-round-xl shadow-1">
                        <p className="text-700 text-sm mb-3">
                            카카오톡 채널 관리자 센터에서 내 공장 이름으로 비즈니스 카카오톡 채널을 개설합니다.
                        </p>
                        <Button 
                            label="채널 관리자 센터 바로가기" 
                            icon="pi pi-external-link" 
                            className="p-button-outlined p-button-sm w-full" 
                            onClick={() => window.open('https://center-pf.kakao.com', '_blank')} 
                        />
                    </Card>
                </div>
                <div className="col-12 md:col-4">
                    <Card title="2단계: 카카오 i 오픈빌더 스킬 등록" subTitle="Webhook URL 연결" className="h-full border-round-xl shadow-1">
                        <p className="text-700 text-sm mb-2">
                            [카카오 i 오픈빌더] ➔ [스킬] 메뉴에서 [스킬 생성]을 누르고 위 복사한 URL을 붙여넣습니다.
                        </p>
                        <Message severity="info" text="요청 메서드: POST / Content-Type: application/json" className="mt-2 w-full" />
                    </Card>
                </div>
                <div className="col-12 md:col-4">
                    <Card title="3단계: 시나리오 연결 및 챗봇 배포" subTitle="자동 주문 수신 시작" className="h-full border-round-xl shadow-1">
                        <p className="text-700 text-sm mb-3">
                            [주문하기] 시나리오에 스킬을 연결하고 챗봇을 배포하면, 거래처(소매점) 톡 주문이 KaratFlow 대시보드로 즉시 수신됩니다.
                        </p>
                        <Button 
                            label="오픈빌더 콘솔 접속" 
                            icon="pi pi-external-link" 
                            className="p-button-outlined p-button-success p-button-sm w-full" 
                            onClick={() => window.open('https://i.kakao.com', '_blank')} 
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
};
