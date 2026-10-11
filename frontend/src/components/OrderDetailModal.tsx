import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { formatImageUrl } from '../utils/image';
import { PipelineStatusBadge } from './pipeline/PipelineStatusBadge';

interface OrderDetailModalProps {
    visible: boolean;
    onHide: () => void;
    order: any;
    orderDetailData: any;
    pipelineStages?: string[];
    pipelineSteps?: any[];
    advanceStage: (id: number) => void;
    openSubcontractModal: (id: number) => void;
    openChangeModal: () => void;
    openCancelModal: (id: number) => void;
    handlePrint: (order: any, type: 'label' | 'invoice') => void;
    statusBodyTemplate: (rowData: any) => React.ReactNode;
}

const formatDate = (dateStr: any) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
        return String(dateStr);
    }
};

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ 
    visible, onHide, order, orderDetailData, pipelineStages = [], pipelineSteps = [], advanceStage, openSubcontractModal, 
    openChangeModal, openCancelModal, handlePrint, statusBodyTemplate 
}) => {
    const [imageZoomVisible, setImageZoomVisible] = useState<boolean>(false);

    if (!order) return null;
    const rowData = order;

    // Determine effective template steps for this order
    const stepsToUse = (orderDetailData?.templateSteps && orderDetailData.templateSteps.length > 0)
        ? orderDetailData.templateSteps
        : (pipelineSteps && pipelineSteps.length > 0 ? pipelineSteps : []);

    const stagesList: string[] = stepsToUse.length > 0
        ? stepsToUse.map((s: any) => s.stageName || s.stageCode)
        : (pipelineStages && pipelineStages.length > 0 ? pipelineStages : []);

    // Current order stage
    const currentStage = orderDetailData?.workOrders?.[0]?.stage || rowData.stage || (stagesList[0] || '');
    const currentStageIdx = stagesList.indexOf(currentStage) >= 0 ? stagesList.indexOf(currentStage) : 0;
    const isDone = (st: string) => 
        st === '완성' || st === '완료' || st === 'COMPLETED' || st === 'DONE' || 
        (stagesList.length > 0 && stagesList.indexOf(st) === stagesList.length - 1);
    const isFinalStage = isDone(currentStage) || rowData.status === 'COMPLETED';

    // Determine timeline events (from orderDetailData or dynamic fallback)
    const timelineEvents = (orderDetailData?.timelineEvents && orderDetailData.timelineEvents.length > 0)
        ? orderDetailData.timelineEvents
        : stagesList.map((st: string, idx: number) => {
            const isCompleted = idx <= currentStageIdx;
            return {
                stage: st,
                date: isCompleted ? (rowData.createdAt || rowData.date) : null,
                icon: isCompleted ? "pi pi-check" : "pi pi-circle",
                color: isCompleted ? "#22C55E" : "#9E9E9E"
            };
        });

    // Determine work orders (from orderDetailData or dynamic fallback)
    const workOrders = (orderDetailData?.workOrders && orderDetailData.workOrders.length > 0)
        ? orderDetailData.workOrders
        : [{
            id: rowData.id,
            workOrderNo: rowData.orderNo ? `${rowData.orderNo}-01` : `ORD-${rowData.id}-01`,
            stage: currentStage,
            createdAt: rowData.createdAt || rowData.date
        }];

    const getStepBgColor = (stageName: string) => {
        if (!stepsToUse || stepsToUse.length === 0) return null;
        
        let matched = stepsToUse.find((step: any) => step.stageName === stageName);
        if (!matched) {
            matched = stepsToUse.find((step: any) => 
                step.stageName && step.stageName.trim().toLowerCase() === stageName.trim().toLowerCase()
            );
        }

        return matched ? (matched.colorGradient || matched.colorHex) : null;
    };

    return (
        <Dialog 
            header={
                <div className="flex justify-content-between align-items-center w-full pr-4">
                    <div className="flex align-items-center gap-3">
                        <i className="pi pi-box text-primary text-2xl"></i>
                        <div>
                            <span className="text-xl font-bold text-900">주문 상세 정보</span>
                            <span className="text-500 text-sm ml-2 font-mono">({rowData.orderNo || `KF-${rowData.id}`})</span>
                        </div>
                    </div>
                    <div className="flex gap-2 mr-4">
                        <Button 
                            icon="pi pi-print" 
                            label="라벨 인쇄" 
                            onClick={() => handlePrint({ ...rowData, ...orderDetailData }, 'label')} 
                            className="p-button-outlined p-button-secondary p-button-sm" 
                        />
                        <Button 
                            icon="pi pi-file-pdf" 
                            label="명세서 인쇄" 
                            onClick={() => handlePrint({ ...rowData, ...orderDetailData }, 'invoice')} 
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
                                    <div className="flex align-items-center gap-2">
                                        <PipelineStatusBadge 
                                            rowData={{ ...rowData, stage: currentStage, templateSteps: stepsToUse }} 
                                            pipelineSteps={stepsToUse} 
                                            pipelineStages={stagesList} 
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-column gap-3">
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-sm">주문 No.</span>
                                        <span className="text-primary font-bold font-mono text-base">#{rowData.id}</span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-sm">주문 접수일시</span>
                                        <span className="text-800 font-medium text-sm">
                                            {(() => {
                                                const rawDt = orderDetailData?.createdAt || rowData.createdAt;
                                                if (rawDt) {
                                                    const d = new Date(rawDt);
                                                    if (!isNaN(d.getTime())) {
                                                        const yyyy = d.getFullYear();
                                                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                        const dd = String(d.getDate()).padStart(2, '0');
                                                        let hours = d.getHours();
                                                        const period = hours < 12 ? '오전' : '오후';
                                                        hours = hours % 12;
                                                        if (hours === 0) hours = 12;
                                                        const min = String(d.getMinutes()).padStart(2, '0');
                                                        return `${yyyy}-${mm}-${dd} ${period} ${hours}:${min}`;
                                                    }
                                                }
                                                return orderDetailData?.orderDate || rowData.date || '-';
                                            })()}
                                        </span>
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
                                    <span className="font-bold text-700">{orderDetailData?.quantity || rowData.quantity || 1}개</span>
                                </div>
                                <div className="flex gap-4 align-items-start">
                                    {(() => {
                                        const rawUrl = orderDetailData?.imageUrl || rowData.imageUrl;
                                        const imgSrc = formatImageUrl(rawUrl);
                                        return (
                                            <div className="flex align-items-center justify-content-center">
                                                {imgSrc ? (
                                                    <div 
                                                        className="relative border-round shadow-2 border-1 border-300 cursor-pointer overflow-hidden flex align-items-center justify-content-center transition-all transition-duration-150 hover:shadow-4 surface-100"
                                                        style={{ width: '84px', height: '84px' }}
                                                        onClick={() => setImageZoomVisible(true)}
                                                        title="클릭하여 이미지 크게 보기"
                                                    >
                                                        <img 
                                                            src={imgSrc} 
                                                            alt="제품 이미지" 
                                                            style={{ width: '84px', height: '84px', objectFit: 'cover' }} 
                                                            onError={(e: any) => { 
                                                                e.target.style.display = 'none';
                                                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div 
                                                            className="absolute bottom-0 right-0 bg-black-alpha-70 text-white flex align-items-center justify-content-center border-top-left-radius-md"
                                                            style={{ width: '22px', height: '22px' }}
                                                        >
                                                            <i className="pi pi-search-plus text-xs" />
                                                        </div>
                                                    </div>
                                                ) : null}
                                                <div 
                                                    className="border-round shadow-2 border-1 border-300 bg-surface-100 align-items-center justify-content-center text-400" 
                                                    style={{ width: '84px', height: '84px', display: imgSrc ? 'none' : 'flex' }}
                                                >
                                                    <i className="pi pi-image text-3xl" />
                                                </div>
                                            </div>
                                        );
                                    })()}
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
                                            <span className="text-600 text-sm">가격</span>
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
                    <div className="flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                        <h3 className="m-0 text-800 text-base font-bold flex align-items-center gap-2">
                            <i className="pi pi-sliders-h text-purple-500"></i> 공정 진행 타임라인
                        </h3>
                        {(orderDetailData?.templateName || rowData.templateName) && (
                            <div className="flex align-items-center gap-1.5 text-xs bg-gray-100 border-round-2xl px-3 py-1">
                                <i className="pi pi-sitemap text-primary text-xs"></i>
                                <span className="text-500 font-normal">적용 템플릿</span>
                                <span className="text-400 font-normal">·</span>
                                <span className="text-800 font-bold">{orderDetailData?.templateName || rowData.templateName}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="w-full flex justify-content-center align-items-center py-3 px-3 surface-50 border-round border-1 border-200 overflow-x-auto">
                        <div className="flex align-items-center gap-4">
                            {timelineEvents.map((ev: any, idx: number) => {
                                const isCompleted = idx <= currentStageIdx;
                                const stepBg = getStepBgColor(ev.stage) || (isCompleted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0');
                                const isLast = idx === timelineEvents.length - 1;

                                return (
                                    <React.Fragment key={idx}>
                                        <div className="flex flex-column align-items-center text-center" style={{ minWidth: '90px' }}>
                                            <div 
                                                className="border-circle flex align-items-center justify-content-center mb-2 transition-transform transform hover:scale-105"
                                                style={{ 
                                                    width: '52px',
                                                    height: '52px',
                                                    background: isCompleted ? stepBg : '#f1f5f9',
                                                    boxShadow: isCompleted ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                                    border: isCompleted ? '2.5px solid #ffffff' : '2px dashed #cbd5e1'
                                                }}
                                            >
                                                <i className={`${isCompleted ? (ev.icon || 'pi pi-check') : 'pi pi-circle'} text-lg ${isCompleted ? 'text-white font-bold' : 'text-400'}`}></i>
                                            </div>
                                            <span className={`font-bold text-xs px-2.5 py-0.5 border-round shadow-1 bg-white ${isCompleted ? 'text-900' : 'text-500'}`}>
                                                {ev.stage}
                                            </span>
                                            <div className="text-xs text-500 mt-1" style={{ whiteSpace: 'nowrap' }}>
                                                {ev.date ? (() => {
                                                    try {
                                                        const d = new Date(ev.date);
                                                        const month = d.getMonth() + 1;
                                                        const day = d.getDate();
                                                        const hours = d.getHours();
                                                        const minutes = String(d.getMinutes()).padStart(2, '0');
                                                        const ampm = hours < 12 ? '오전' : '오후';
                                                        const h12 = hours % 12 === 0 ? 12 : hours % 12;
                                                        return `${month}. ${day}. ${ampm} ${h12}:${minutes}`;
                                                    } catch {
                                                        return '-';
                                                    }
                                                })() : '-'}
                                            </div>
                                            {ev.elapsed && (
                                                <span className="bg-pink-100 text-pink-700 px-2 py-0.5 border-round font-bold text-xs mt-1">
                                                    {ev.elapsed}
                                                </span>
                                            )}
                                        </div>
                                        {!isLast && (
                                            <div className="flex align-items-center justify-content-center px-1 mb-4 text-400">
                                                <i className="pi pi-chevron-right font-bold text-xl text-primary" style={{ opacity: 0.75 }} />
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Items Tracking Section */}
                <div className="surface-0 border-1 border-300 border-round p-4 shadow-1">
                    <h3 className="m-0 mb-3 text-800 text-base font-bold flex align-items-center gap-2">
                        <i className="pi pi-list text-blue-500"></i> 개별 물건 트래킹 
                        <span className="text-500 text-xs font-normal">
                            (총 {workOrders.length}개 물건)
                        </span>
                    </h3>
                    
                    <DataTable 
                        value={workOrders} 
                        size="small" 
                        stripedRows 
                        responsiveLayout="scroll" 
                        className="p-datatable-sm"
                    >
                        <Column 
                            field="workOrderNo" 
                            header="물건 ID" 
                            body={(r: any) => (
                                <div className="flex align-items-center gap-2 font-mono font-bold text-primary">
                                    <i className="pi pi-file"></i> {r.workOrderNo || (rowData.orderNo ? `${rowData.orderNo}-01` : `ORD-${r.id}-01`)}
                                </div>
                            )}
                        />
                        <Column 
                            field="stage" 
                            header="현재 공정 상태" 
                            body={(r: any) => (
                                <PipelineStatusBadge 
                                    rowData={{ ...r, templateSteps: stepsToUse }} 
                                    pipelineSteps={stepsToUse} 
                                    pipelineStages={stagesList} 
                                />
                            )}
                        />
                        <Column 
                            field="createdAt" 
                            header="공정 투입 일시" 
                            body={(r: any) => formatDate(r.createdAt || rowData.createdAt)}
                        />
                    </DataTable>
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
                        label={isFinalStage ? "최종 공정 완료 ✅" : "다음 공정으로 진행 ➡️"} 
                        icon={isFinalStage ? "pi pi-check-circle" : "pi pi-forward"} 
                        onClick={() => advanceStage(rowData.id)} 
                        disabled={isFinalStage} 
                        className={`p-button-raised px-4 py-2 font-bold ${isFinalStage ? 'p-button-secondary' : 'p-button-success'}`} 
                    />
                </div>

            </div>

            {/* Image Zoom Lightbox Dialog */}
            <Dialog
                visible={imageZoomVisible}
                onHide={() => setImageZoomVisible(false)}
                header={
                    <div className="flex align-items-center gap-2 text-white font-bold">
                        <i className="pi pi-search-plus text-orange-400 text-xl" />
                        <span>제품 이미지 상세 확대 보기</span>
                    </div>
                }
                dismissableMask
                modal
                style={{ width: '90vw', maxWidth: '640px', backgroundColor: '#0f172a', borderRadius: '12px', overflow: 'hidden' }}
                maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)' }}
                headerStyle={{ backgroundColor: '#0f172a', color: '#ffffff', borderBottom: '1px solid #1e293b', padding: '1rem 1.5rem' }}
                contentStyle={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '1.5rem' }}
                contentClassName="flex flex-column align-items-center justify-content-center"
            >
                {(() => {
                    const rawUrl = orderDetailData?.imageUrl || rowData.imageUrl;
                    const imgSrc = formatImageUrl(rawUrl);
                    const productName = orderDetailData?.productName || rowData.unmappedProductName || rowData.design || '제품 이미지';
                    return (
                        <div className="flex flex-column align-items-center justify-content-center w-full gap-3">
                            {imgSrc ? (
                                <div className="w-full flex align-items-center justify-content-center p-3 border-round-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                                    <img 
                                        src={imgSrc} 
                                        alt={productName} 
                                        className="border-round shadow-4"
                                        style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
                                    />
                                </div>
                            ) : (
                                <div className="text-white-alpha-70 py-5 text-center">
                                    <i className="pi pi-image text-5xl mb-2 block text-400" />
                                    <span>등록된 고화질 이미지가 없습니다.</span>
                                </div>
                            )}
                            <div className="text-white-alpha-90 text-sm font-medium flex align-items-center gap-2 px-3 py-2 border-round w-full justify-content-between" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                                <span className="flex align-items-center gap-2">
                                    <i className="pi pi-tag text-orange-400" />
                                    <strong>{productName}</strong>
                                </span>
                                <span className="text-xs text-400">클릭 또는 ESC키로 닫기</span>
                            </div>
                        </div>
                    );
                })()}
            </Dialog>
        </Dialog>
    );
};
