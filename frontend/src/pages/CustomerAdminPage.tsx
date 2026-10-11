import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

export const CustomerAdminPage: React.FC = () => {
    const toast = useRef<Toast>(null);

    // --- Tab 1: 카톡 유저 별칭(Alias) 관리 데이터 ---
    const [customerAliases, setCustomerAliases] = useState([
        { id: 1, botUserKey: 'bot_a8f92c11', originalName: '샤인', alias: '종로3가 샤인주얼리 (김대표님)', phone: '010-1234-5678', orderCount: 5, linked: true, notes: '18K 핑크골드 메인' },
        { id: 2, botUserKey: 'bot_b9d83e22', originalName: '골드라인', alias: '강남 골드라인 (이이사님)', phone: '010-9876-5432', orderCount: 3, linked: true, notes: '24K 순금 신속제작 요청' },
        { id: 3, botUserKey: 'bot_c7e14f33', originalName: '스타주얼리', alias: '명동 스타주얼리', phone: '010-5555-4444', orderCount: 2, linked: false, notes: '신규 카톡 문의 거래처' }
    ]);

    // --- Tab 2: 외주 파트너 관리 데이터 ---
    const [vendorPartners, setVendorPartners] = useState([
        { id: 101, category: '세공', name: '종로 세공사 (박기사님)', phone: '010-2222-1111', status: '협력중' },
        { id: 102, category: '주물(캐스팅)', name: '대성 주물 정밀', phone: '010-3333-2222', status: '협력중' },
        { id: 103, category: 'CAD', name: '3D 주얼리 CAD 랩', phone: '010-4444-3333', status: '협력중' },
        { id: 104, category: '도금', name: '로듐 도금 전처리', phone: '010-6666-7777', status: '대기중' }
    ]);

    // Alias Edit Dialog State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [editAlias, setEditAlias] = useState('');
    const [editNotes, setEditNotes] = useState('');

    const openEditModal = (rowData: any) => {
        setSelectedCustomer(rowData);
        setEditAlias(rowData.alias);
        setEditNotes(rowData.notes);
        setEditModalVisible(true);
    };

    const saveAlias = () => {
        if (!selectedCustomer) return;
        setCustomerAliases(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, alias: editAlias, notes: editNotes } : c));
        setEditModalVisible(false);
        toast.current?.show({ severity: 'success', summary: '별칭 저장 완료', detail: `'${editAlias}' 별칭이 업데이트되었습니다.`, life: 3000 });
    };

    const copyShareLink = (type: string, name: string) => {
        const link = type === 'order' 
            ? `${window.location.origin}/orders/track?customer=${encodeURIComponent(name)}`
            : `${window.location.origin}/catalog`;
        navigator.clipboard.writeText(link);
        toast.current?.show({ severity: 'info', summary: '링크 복사 완료', detail: `${name} 님 전용 카톡 공유 링크가 복사되었습니다!`, life: 3000 });
    };

    return (
        <div className="p-4 surface-ground min-h-screen">
            <Toast ref={toast} />
            <div className="flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="text-900 font-bold m-0 flex align-items-center gap-2">
                        <i className="pi pi-users text-primary text-2xl"></i>
                        고객 & 외주 파트너 관리
                    </h2>
                    <p className="text-500 text-sm mt-1 mb-0">
                        카톡 챗봇 유저 별칭(Alias) 라벨링, 외주업체 연락처 관리 및 원클릭 카톡 공유 링크생성
                    </p>
                </div>
            </div>

            <TabView className="custom-admin-tabs">
                
                {/* Tab 1: 카톡 유저 별칭(Alias) 관리 */}
                <TabPanel header={<span><i className="pi pi-comments mr-2"></i>카톡 챗봇 거래처 별칭(Alias) 관리</span>}>
                    <Card className="border-round-xl shadow-1">
                        <DataTable value={customerAliases} size="small" paginator rows={10} responsiveLayout="scroll">
                            <Column field="botUserKey" header="카톡 유저 ID" body={(r) => <span className="font-mono text-xs text-500">{r.botUserKey}</span>} />
                            <Column field="originalName" header="카톡 닉네임" body={(r) => <span className="text-700">{r.originalName}</span>} />
                            <Column field="alias" header="지정 별칭 (실제 매장명)" body={(r) => <span className="font-bold text-primary text-base">{r.alias}</span>} />
                            <Column field="phone" header="연락처" />
                            <Column field="orderCount" header="누적 주문" body={(r) => <span className="font-bold text-700">{r.orderCount}건</span>} />
                            <Column field="linked" header="인증 상태" body={(r) => r.linked ? <Tag severity="success" value="카카오 인증됨" /> : <Tag severity="warning" value="미인증 유저" />} />
                            <Column field="notes" header="특이사항/메모" />
                            <Column header="작업" body={(r) => (
                                <div className="flex gap-2">
                                    <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-sm" tooltip="별칭 수정" onClick={() => openEditModal(r)} />
                                    <Button icon="pi pi-share-alt" className="p-button-rounded p-button-text p-button-info p-button-sm" tooltip="카톡 공유링크 복사" onClick={() => copyShareLink('order', r.alias)} />
                                </div>
                            )} />
                        </DataTable>
                    </Card>
                </TabPanel>

                {/* Tab 2: 외주 파트너 (외주업체/기사님) 관리 */}
                <TabPanel header={<span><i className="pi pi-building mr-2"></i>외주 파트너 (세공/캐스팅/CAD) 관리</span>}>
                    <Card className="border-round-xl shadow-1">
                        <div className="flex justify-content-between align-items-center mb-3">
                            <span className="text-700 font-bold">등록된 협력 외주업체 리스트</span>
                            <Button label="+ 신규 외주 파트너 등록" icon="pi pi-plus" className="p-button-primary p-button-sm" />
                        </div>
                        <DataTable value={vendorPartners} size="small" paginator rows={10} responsiveLayout="scroll">
                            <Column field="category" header="공정 분야" body={(r) => <Tag value={r.category} severity="info" />} />
                            <Column field="name" header="업체명 / 담당자" body={(r) => <span className="font-bold text-900">{r.name}</span>} />
                            <Column field="phone" header="연락처" />
                            <Column field="status" header="상태" body={(r) => <Tag severity="success" value={r.status} />} />
                            <Column header="작업" body={() => <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-sm" />} />
                        </DataTable>
                    </Card>
                </TabPanel>

                {/* Tab 3: 원클릭 공유 링크 메이커 */}
                <TabPanel header={<span><i className="pi pi-link mr-2"></i>원클릭 카톡 공유 링크 생성</span>}>
                    <Card className="border-round-xl shadow-1">
                        <h4 className="m-0 text-900 font-bold mb-3">소매점 및 고객 전용 실시간 카톡 공유 링크</h4>
                        <div className="grid">
                            <div className="col-12 md:col-6">
                                <div className="p-4 surface-50 border-1 border-200 border-round-xl">
                                    <div className="font-bold text-lg text-primary mb-2">📋 실시간 주문 공정 확인 링크</div>
                                    <p className="text-600 text-sm mb-3">소매점이 자신의 주문 공정(접수➔CAD➔주물➔세공) 진행 상황을 톡으로 열람하는 링크입니다.</p>
                                    <Button label="주문 확인 링크 복사" icon="pi pi-copy" className="p-button-outlined p-button-primary p-button-sm w-full" onClick={() => copyShareLink('order', '샤인주얼리')} />
                                </div>
                            </div>
                            <div className="col-12 md:col-6">
                                <div className="p-4 surface-50 border-1 border-200 border-round-xl">
                                    <div className="font-bold text-lg text-yellow-700 mb-2">📖 공장 카탈로그 공유 링크</div>
                                    <p className="text-600 text-sm mb-3">공장의 주얼리 디자인 카탈로그를 카카오톡으로 전송하여 신규 주문을 유도하는 링크입니다.</p>
                                    <Button label="카탈로그 링크 복사" icon="pi pi-copy" className="p-button-outlined p-button-warning p-button-sm w-full" onClick={() => copyShareLink('catalog', '전체')} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabPanel>

            </TabView>

            {/* Edit Alias Dialog */}
            <Dialog 
                header="카톡 고객 별칭(Alias) 수정" 
                visible={editModalVisible} 
                style={{ width: '450px' }} 
                onHide={() => setEditModalVisible(false)}
                dismissableMask
            >
                <div className="p-fluid flex flex-column gap-3 mt-2">
                    <div>
                        <label className="font-bold text-sm text-700 mb-1 block">카톡 유저 ID</label>
                        <InputText value={selectedCustomer?.botUserKey || ''} disabled className="bg-100 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="font-bold text-sm text-700 mb-1 block">지정 별칭 (실제 매장명 / 상호명)</label>
                        <InputText value={editAlias} onChange={(e) => setEditAlias(e.target.value)} placeholder="예: 종로3가 샤인주얼리" />
                    </div>
                    <div>
                        <label className="font-bold text-sm text-700 mb-1 block">특이사항 메모</label>
                        <InputText value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="예: 18K 핑크골드 선호" />
                    </div>
                    <div className="flex justify-content-end gap-2 mt-3">
                        <Button label="취소" className="p-button-text p-button-secondary" onClick={() => setEditModalVisible(false)} />
                        <Button label="저장" icon="pi pi-check" className="p-button-primary" onClick={saveAlias} />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};
