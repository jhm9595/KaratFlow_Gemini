import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

interface PartnerHandshakeModalProps {
    visible: boolean;
    onHide: () => void;
    handshakes: any[];
    handshakePin: string;
    setHandshakePin: (val: string) => void;
    generatedPin: string | null;
    requestHandshake: () => void;
    verifyHandshake: () => void;
    businessNumber: string;
    setBusinessNumber: (val: string) => void;
    verifyBusiness: () => void;
    businessResult: any;
}

export const PartnerHandshakeModal: React.FC<PartnerHandshakeModalProps> = ({
    visible, onHide, handshakes, handshakePin, setHandshakePin, generatedPin,
    requestHandshake, verifyHandshake, businessNumber, setBusinessNumber,
    verifyBusiness, businessResult
}) => {
    return (
        <Dialog 
            header="파트너사 연동 및 사업자 검증" 
            visible={visible} 
            style={{ width: '55vw', maxWidth: '800px' }} 
            onHide={onHide}
            dismissableMask
        >
            <p className="m-0 mb-4 text-600 text-sm">
                파트너사(제조공장/소매점) 간 데이터 연동을 위한 핀(PIN) 번호 발급 및 국세청 사업자 조회를 수행합니다.
            </p>
            
            <div className="grid">
                <div className="col-12 md:col-6">
                    <div className="surface-100 p-4 border-round h-full flex flex-column align-items-center justify-content-center border-1 border-200">
                        <h3 className="m-0 mb-2 text-base font-bold text-900">파트너사 연동 요청 (핀번호 발급)</h3>
                        <p className="text-xs text-600 mb-4 text-center">제조업체에게 전달할 1회용 6자리 핀번호를 발급받습니다.</p>
                        {generatedPin ? (
                            <div className="text-center">
                                <h1 className="text-primary m-0" style={{ fontSize: '2.5rem', letterSpacing: '0.4rem' }}>{generatedPin}</h1>
                                <small className="text-500">이 핀번호를 제조업체에게 알려주세요.</small>
                            </div>
                        ) : (
                            <Button label="핀번호 발급받기" icon="pi pi-key" onClick={requestHandshake} className="p-button-sm" />
                        )}
                    </div>
                </div>
                
                <div className="col-12 md:col-6">
                    <div className="surface-100 p-4 border-round h-full flex flex-column align-items-center justify-content-center border-1 border-200">
                        <h3 className="m-0 mb-2 text-base font-bold text-900">파트너사 인증 (핀번호 입력)</h3>
                        <p className="text-xs text-600 mb-4 text-center">소매업체로부터 전달받은 6자리 핀번호를 입력하여 연동을 승인합니다.</p>
                        <div className="p-inputgroup">
                            <InputText 
                                placeholder="6자리 PIN 입력" 
                                value={handshakePin} 
                                onChange={(e) => setHandshakePin(e.target.value)} 
                                maxLength={6} 
                                className="text-center text-lg font-bold" 
                            />
                            <Button label="인증" icon="pi pi-check" severity="success" onClick={verifyHandshake} />
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="mt-5 mb-3 text-base font-bold text-900">사업자 진위 검증</h3>
            <div className="surface-100 p-4 border-round mb-4 border-1 border-200">
                <p className="text-xs text-600 mb-3">파트너사의 사업자등록번호(10자리)를 입력하여 국세청 휴/폐업 상태를 조회합니다.</p>
                <div className="p-inputgroup mb-3" style={{ maxWidth: '400px' }}>
                    <InputText 
                        placeholder="사업자번호 (숫자만)" 
                        value={businessNumber} 
                        onChange={(e) => setBusinessNumber(e.target.value)} 
                    />
                    <Button label="검증하기" icon="pi pi-search" onClick={verifyBusiness} />
                </div>
                {businessResult && (
                    <div className={`p-3 border-round ${businessResult.statusCode === '01' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <i className={`pi ${businessResult.statusCode === '01' ? 'pi-check-circle' : 'pi-times-circle'} mr-2`}></i>
                        <strong>[{businessResult.businessNumber}]</strong> {businessResult.statusName} ({businessResult.taxType})
                    </div>
                )}
            </div>

            <h3 className="mt-4 mb-3 text-base font-bold text-900">내 파트너십 목록</h3>
            <div className="surface-border border-top-1 pt-3">
                {handshakes.length === 0 ? (
                    <p className="text-500 text-center py-4 text-sm">연동된 파트너사가 없습니다.</p>
                ) : (
                    <div className="flex flex-column gap-2">
                        {handshakes.map(h => (
                            <div key={h.id} className="flex justify-content-between align-items-center surface-50 p-3 border-round border-1 border-200">
                                <div>
                                    <div className="font-bold text-sm">{h.targetCompanyName} <i className="pi pi-arrows-h mx-2 text-400"></i> {h.requesterCompanyName}</div>
                                    <small className="text-500">요청일: {new Date(h.createdAt).toLocaleString()}</small>
                                </div>
                                <div>
                                    <span className={`p-badge ${h.status === 'APPROVED' ? 'p-badge-success' : 'p-badge-warning'}`}>{h.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Dialog>
    );
};
