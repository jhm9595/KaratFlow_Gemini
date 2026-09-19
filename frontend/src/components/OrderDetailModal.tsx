import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface OrderDetailModalProps {
    visible: boolean;
    onHide: () => void;
    order: any;
    orderDetailData: any;
    advanceStage: (id: number) => void;
    openSubcontractModal: (id: number) => void;
    openChangeModal: () => void;
    openCancelModal: (id: number) => void;
    handlePrint: (order: any, type: 'label' | 'invoice') => void;
    statusBodyTemplate: (rowData: any) => React.ReactNode;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ 
    visible, onHide, order, orderDetailData, advanceStage, openSubcontractModal, 
    openChangeModal, openCancelModal, handlePrint, statusBodyTemplate 
}) => {
    if (!order) return null;
    const rowData = order;

    return (
        <Dialog 
            header={
                <div className="flex justify-content-between align-items-center w-full" style={{ paddingRight: '2rem' }}>
                    <span className="text-xl font-bold text-gray-900">주문 상세 정보</span>
                    <div className="flex gap-2">
                        <Button icon="pi pi-print" tooltip="라벨 인쇄" tooltipOptions={{ position: 'bottom' }} onClick={() => handlePrint(order, 'label')} className="p-button-rounded p-button-outlined p-button-success p-button-sm" />
                        <Button icon="pi pi-file-pdf" tooltip="명세서 인쇄" tooltipOptions={{ position: 'bottom' }} onClick={() => handlePrint(order, 'invoice')} className="p-button-rounded p-button-outlined p-button-info p-button-sm" />
                    </div>
                </div>
            }
            visible={visible} 
            style={{ width: '70vw' }} 
            breakpoints={{ '960px': '90vw', '641px': '100vw' }} 
            onHide={onHide}
        >
            <div className="flex flex-column gap-5 mt-3">
                
                {/* 1. Basic Info Section */}
                <div className="grid">
                    {/* Left: Order Info */}
                    <div className="col-12 md:col-6">
                        <div className="border-1 surface-border border-round p-4 h-full bg-white shadow-1">
                            <h3 className="m-0 mb-4 text-800 text-lg border-bottom-1 surface-border pb-2">기본 정보</h3>
                            <div className="flex flex-column gap-3">
                                <div className="flex justify-content-between align-items-center">
                                    <span className="text-500 font-medium">주문 번호</span>
                                    <span className="text-900 font-bold">{rowData.orderNo || `KF-${rowData.id}`}</span>
                                </div>
                                <div className="flex justify-content-between align-items-center">
                                    <span className="text-500 font-medium">고객명</span>
                                    <span className="text-900">{rowData.customerName || '-'}</span>
                                </div>
                                <div className="flex justify-content-between align-items-center">
                                    <span className="text-500 font-medium">표면 마감</span>
                                    <span className="text-900">{rowData.surfaceFinish || '-'}</span>
                                </div>
                                <div className="flex justify-content-between align-items-center">
                                    <span className="text-500 font-medium">각인 내용</span>
                                    <span className="text-900">{rowData.engravingText || '-'} <span className="text-500 text-sm">({rowData.engravingLocation || '없음'})</span></span>
                                </div>
                                <div className="flex justify-content-between align-items-center pt-3 border-top-1 surface-border mt-1">
                                    <span className="text-500 font-medium">주문 상태 (대표)</span>
                                    <div>{statusBodyTemplate(rowData)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="col-12 md:col-6">
                        <div className="border-1 surface-border border-round p-4 h-full bg-white shadow-1">
                            <h3 className="m-0 mb-4 text-800 text-lg border-bottom-1 surface-border pb-2">제품 정보</h3>
                            <div className="flex flex-column gap-3">
                                <div className="flex justify-content-between align-items-center">
                                    <span className="text-500 font-medium">브랜드</span>
                                    <span className="text-900 font-bold">{rowData.brand || '-'}</span>
                                </div>
                                <div className="flex justify-content-between align-items-center">
                                    <span className="text-500 font-medium">제품명 (디자인)</span>
                                    <span className="text-900">{rowData.unmappedProductName || rowData.design || '-'}</span>
                                </div>
                                <div className="flex justify-content-between align-items-center">
                                    <span className="text-500 font-medium">총 수량</span>
                                    <span className="text-900 font-bold text-lg">{rowData.quantity || 1}개</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Timeline Section */}
                <div className="border-1 surface-border border-round p-4 bg-white shadow-1">
                    <h3 className="m-0 mb-4 text-800 text-lg">공정 진행 타임라인</h3>
                    {!orderDetailData ? (
                        <div className="text-500 text-center py-3">데이터를 불러오는 중...</div>
                    ) : orderDetailData.timelineEvents && orderDetailData.timelineEvents.length > 0 ? (
                        <div className="flex flex-wrap gap-3 mt-2">
                            {orderDetailData.timelineEvents.map((item: any, idx: number) => (
                                <div key={idx} className="flex align-items-center gap-2">
                                    <div className="flex flex-column align-items-center">
                                        <div className="w-2rem h-2rem border-circle flex align-items-center justify-content-center font-bold text-white" style={{ backgroundColor: item.color || '#6b7280' }}>
                                            <i className={`${item.icon || 'pi pi-check'} text-xs`}></i>
                                        </div>
                                        <div className="mt-2 text-center" style={{ minWidth: '80px' }}>
                                            <div className="text-sm font-bold text-700">{item.stage}</div>
                                            <div className="text-xs text-500 mt-1">{item.date ? new Date(item.date).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                            {item.elapsed && <div className="text-xs text-pink-500 font-bold mt-1">{item.elapsed}</div>}
                                        </div>
                                    </div>
                                    {idx < orderDetailData.timelineEvents.length - 1 && (
                                        <div className="h-2px bg-gray-300 flex-1" style={{ minWidth: '20px', marginBottom: '40px' }}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-500 text-center py-3">공정 타임라인 데이터가 없습니다.</div>
                    )}
                </div>

                {/* 3. Items Tracking Section */}
                <div className="border-1 surface-border border-round p-4 bg-white shadow-1">
                    <h3 className="m-0 mb-4 text-800 text-lg flex align-items-center gap-2">
                        개별 물건 트래킹 <span className="text-500 text-sm font-normal">(총 {orderDetailData?.workOrders?.length || 0}개)</span>
                    </h3>
                    {!orderDetailData ? (
                        <div className="text-500 text-center py-3">데이터를 불러오는 중...</div>
                    ) : orderDetailData.workOrders && orderDetailData.workOrders.length > 0 ? (
                        <DataTable value={orderDetailData.workOrders} size="small" stripedRows responsiveLayout="scroll" className="p-datatable-sm">
                            <Column field="workOrderNo" header="바코드 / 번호" body={(r: any) => <span className="font-bold text-primary">#{r.id}</span>}></Column>
                            <Column field="stage" header="현재 공정 상태" body={(r: any) => (
                                <span className={`px-2 py-1 border-round text-sm font-bold ${
                                    r.stage === '접수' || r.stage === 'PENDING' ? 'bg-indigo-100 text-indigo-700' : 
                                    (r.stage === 'CAD' ? 'bg-blue-100 text-blue-700' : 
                                    (r.stage === 'Casting' || r.stage === '주물' ? 'bg-orange-100 text-orange-700' : 
                                    (r.stage === 'Polishing' || r.stage === '세공' ? 'bg-yellow-100 text-yellow-700' : 
                                    (r.stage === 'Plating/Inspection' || r.stage === '도금' || r.stage === '검수' ? 'bg-green-100 text-green-700' : 
                                    'bg-gray-100 text-gray-700'))))
                                }`}>{r.stage}</span>
                            )}></Column>
                            <Column field="createdAt" header="투입 일자" body={(r: any) => r.createdAt ? new Date(r.createdAt).toLocaleString('ko-KR') : '-'}></Column>
                        </DataTable>
                    ) : (
                        <div className="text-500 text-center py-3">등록된 개별 물건이 없습니다.</div>
                    )}
                </div>
                
                {/* 4. Action Buttons */}
                <div className="mt-2 flex gap-3 justify-content-end border-top-1 surface-border pt-4">
                    <Button label="외주 처리" icon="pi pi-truck" onClick={() => openSubcontractModal(rowData.id)} className="p-button-secondary p-button-outlined" />
                    <Button label="변경 요청" icon="pi pi-pencil" onClick={() => openChangeModal()} className="p-button-warning p-button-outlined" />
                    <Button label="주문 취소" icon="pi pi-trash" onClick={() => openCancelModal(rowData.id)} className="p-button-danger p-button-outlined" />
                    <Button label="공정 진행" icon="pi pi-forward" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-success ml-3 px-4" />
                </div>

            </div>
        </Dialog>
    );
};
