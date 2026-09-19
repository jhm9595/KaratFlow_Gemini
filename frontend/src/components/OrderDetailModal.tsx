import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

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

    // Determine timeline events (from orderDetailData or fallback)
    const timelineEvents = orderDetailData?.timelineEvents || [];

    return (
        <Dialog 
            header={
                <div className="flex justify-content-between align-items-center w-full pr-4">
                    <div className="flex align-items-center gap-3">
                        <i className="pi pi-box text-primary text-2xl"></i>
                        <div>
                            <span className="text-xl font-bold text-900">주문 상세 정보</span>
                            <span className="text-500 text-sm ml-2">({rowData.orderNo || `KF-${rowData.id}`})</span>
                        </div>
                    </div>
                    <div className="flex gap-2 mr-4">
                        <Button 
                            icon="pi pi-print" 
                            label="라벨 인쇄" 
                            onClick={() => handlePrint(order, 'label')} 
                            className="p-button-outlined p-button-secondary p-button-sm" 
                        />
                        <Button 
                            icon="pi pi-file-pdf" 
                            label="명세서 인쇄" 
                            onClick={() => handlePrint(order, 'invoice')} 
                            className="p-button-outlined p-button-info p-button-sm" 
                        />
                    </div>
                </div>
            }
            visible={visible} 
            style={{ width: '75vw', maxWidth: '1100px' }} 
            breakpoints={{ '960px': '90vw', '641px': '100vw' }} 
            onHide={onHide}
            dismissableMask
        >
            <div className="flex flex-column gap-4 pt-2">
                
                {/* 1. Basic Info & Product Info Grid */}
                <div className="grid">
                    {/* Left: Order Info */}
                    <div className="col-12 md:col-6">
                        <div className="surface-0 border-1 border-300 border-round p-4 h-full shadow-1 flex flex-column justify-content-between">
                            <div>
                                <div className="flex align-items-center justify-content-between border-bottom-1 border-200 pb-3 mb-3">
                                    <h3 className="m-0 text-800 text-base font-bold flex align-items-center gap-2">
                                        <i className="pi pi-info-circle text-primary"></i> 주문 기본 정보
                                    </h3>
                                    {statusBodyTemplate(rowData)}
                                </div>
                                <div className="flex flex-column gap-3">
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-sm">주문 번호</span>
                                        <span className="text-900 font-bold font-mono">{rowData.orderNo || `KF-${rowData.id}`}</span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-sm">고객명</span>
                                        <span className="text-900 font-medium">{rowData.customerName || '-'}</span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-sm">표면 마감</span>
                                        <span className="text-900">{rowData.surfaceFinish || '유광'}</span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-sm">각인 문구</span>
                                        <span className="text-900 font-medium">
                                            {rowData.engravingText || '없음'} 
                                            {rowData.engravingLocation && <span className="text-500 text-xs ml-1">({rowData.engravingLocation})</span>}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="col-12 md:col-6">
                        <div className="surface-0 border-1 border-300 border-round p-4 h-full shadow-1 flex flex-column justify-content-between">
                            <div>
                                <div className="flex align-items-center justify-content-between border-bottom-1 border-200 pb-3 mb-3">
                                    <h3 className="m-0 text-800 text-base font-bold flex align-items-center gap-2">
                                        <i className="pi pi-tag text-orange-500"></i> 제품 정보
                                    </h3>
                                    <Tag severity="info" value={`${orderDetailData?.quantity || rowData.quantity || 1}개`} rounded />
                                </div>
                                <div className="flex gap-4 align-items-start">
                                    {(orderDetailData?.imageUrl || rowData.imageUrl) && (
                                        <img 
                                            src={orderDetailData?.imageUrl || rowData.imageUrl} 
                                            alt="제품 이미지" 
                                            className="border-round shadow-2 border-1 border-300"
                                            style={{ width: '84px', height: '84px', objectFit: 'cover' }} 
                                            onError={(e: any) => { e.target.src = '/logo.png'; }}
                                        />
                                    )}
                                    <div className="flex-1 flex flex-column gap-3">
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600 text-sm">브랜드</span>
                                            <span className="text-900 font-bold">{orderDetailData?.brand || rowData.brand || '-'}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600 text-sm">제품명 (디자인)</span>
                                            <span className="text-900 font-medium">{orderDetailData?.productName || rowData.unmappedProductName || rowData.design || '-'}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600 text-sm">소비자가</span>
                                            <span className="text-green-600 font-bold">
                                                {rowData.finalConsumerPrice ? `₩${rowData.finalConsumerPrice.toLocaleString()}` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Process Timeline Section */}
                <div className="surface-0 border-1 border-300 border-round p-4 shadow-1">
                    <h3 className="m-0 mb-4 text-800 text-base font-bold flex align-items-center gap-2">
                        <i className="pi pi-sliders-h text-purple-500"></i> 공정 진행 타임라인
                    </h3>
                    
                    {!orderDetailData ? (
                        <div className="text-500 text-center py-4 flex align-items-center justify-content-center gap-2">
                            <i className="pi pi-spin pi-spinner text-xl"></i> 타임라인 데이터를 불러오는 중...
                        </div>
                    ) : timelineEvents.length > 0 ? (
                        <div className="flex flex-wrap align-items-center justify-content-between gap-3 px-2 py-2 surface-50 border-round border-1 border-200">
                            {timelineEvents.map((ev: any, idx: number) => (
                                <React.Fragment key={idx}>
                                    <div className="flex flex-column align-items-center p-2 text-center" style={{ minWidth: '100px' }}>
                                        <div 
                                            className="w-3rem h-3rem border-circle flex align-items-center justify-content-center text-white shadow-2 mb-2"
                                            style={{ backgroundColor: ev.color || '#64748B' }}
                                        >
                                            <i className={`${ev.icon || 'pi pi-check'} text-lg`}></i>
                                        </div>
                                        <div className="font-bold text-800 text-sm">{ev.stage}</div>
                                        <div className="text-xs text-500 mt-1">
                                            {ev.date ? new Date(ev.date).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </div>
                                        {ev.elapsed && (
                                            <span className="bg-pink-100 text-pink-700 px-2 py-1 border-round font-bold text-xs mt-1">
                                                {ev.elapsed}
                                            </span>
                                        )}
                                    </div>
                                    {idx < timelineEvents.length - 1 && (
                                        <div className="flex-1 flex align-items-center justify-content-center" style={{ minWidth: '30px' }}>
                                            <i className="pi pi-chevron-right text-400 text-lg"></i>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="text-500 text-center py-4">공정 타임라인 기록이 없습니다.</div>
                    )}
                </div>

                {/* 3. Items Tracking Section */}
                <div className="surface-0 border-1 border-300 border-round p-4 shadow-1">
                    <h3 className="m-0 mb-3 text-800 text-base font-bold flex align-items-center gap-2">
                        <i className="pi pi-list text-blue-500"></i> 개별 물건 트래킹 
                        <span className="text-500 text-xs font-normal">
                            (총 {orderDetailData?.workOrders?.length || 0}개 작업지시서)
                        </span>
                    </h3>
                    
                    {!orderDetailData ? (
                        <div className="text-500 text-center py-3">데이터를 불러오는 중...</div>
                    ) : orderDetailData.workOrders && orderDetailData.workOrders.length > 0 ? (
                        <DataTable 
                            value={orderDetailData.workOrders} 
                            size="small" 
                            stripedRows 
                            responsiveLayout="scroll" 
                            className="p-datatable-sm"
                        >
                            <Column 
                                field="id" 
                                header="바코드 / 작업지시서 ID" 
                                body={(r: any) => (
                                    <div className="flex align-items-center gap-2 font-mono font-bold text-primary">
                                        <i className="pi pi-barcode"></i> #{r.id} ({r.workOrderNo || `WO-${r.id}`})
                                    </div>
                                )}
                            />
                            <Column 
                                field="stage" 
                                header="현재 공정 상태" 
                                body={(r: any) => {
                                    const st = r.stageName || r.stage || '접수';
                                    return (
                                        <span className="px-3 py-1 border-round text-xs font-bold bg-blue-100 text-blue-800 border-1 border-blue-200">
                                            {st}
                                        </span>
                                    );
                                }}
                            />
                            <Column 
                                field="createdAt" 
                                header="공정 투입 일시" 
                                body={(r: any) => r.createdAt ? new Date(r.createdAt).toLocaleString('ko-KR') : '-'}
                            />
                        </DataTable>
                    ) : (
                        <div className="text-500 text-center py-3 surface-50 border-round">등록된 개별 물건 작업지시서가 없습니다.</div>
                    )}
                </div>

                {/* 4. Bottom Action Bar */}
                <div className="flex flex-wrap gap-2 justify-content-between align-items-center border-top-1 border-300 pt-3 mt-2">
                    <div className="flex gap-2">
                        <Button 
                            label="주문 취소" 
                            icon="pi pi-trash" 
                            onClick={() => openCancelModal(rowData.id)} 
                            className="p-button-outlined p-button-danger p-button-sm" 
                        />
                        <Button 
                            label="변경 요청" 
                            icon="pi pi-pencil" 
                            onClick={() => openChangeModal()} 
                            className="p-button-outlined p-button-warning p-button-sm" 
                        />
                        <Button 
                            label="외주 처리" 
                            icon="pi pi-truck" 
                            onClick={() => openSubcontractModal(rowData.id)} 
                            className="p-button-outlined p-button-secondary p-button-sm" 
                        />
                    </div>
                    
                    <Button 
                        label="다음 공정으로 진행 ➡️" 
                        icon="pi pi-forward" 
                        onClick={() => advanceStage(rowData.id)} 
                        disabled={rowData.status === 'COMPLETED'} 
                        className="p-button-success p-button-raised px-4 py-2 font-bold" 
                    />
                </div>

            </div>
        </Dialog>
    );
};
