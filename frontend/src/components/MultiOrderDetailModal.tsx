import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { formatImageUrl } from '../utils/image';
import { PipelineStatusBadge } from './pipeline/PipelineStatusBadge';

interface MultiOrderDetailModalProps {
    visible: boolean;
    onHide: () => void;
    order: any;
    orderDetailData: any;
    pipelineStages?: string[];
    pipelineSteps?: any[];
    advanceStage?: (id: number) => void;
    advanceWorkOrderStage?: (workOrderId: number) => void;
    openSubcontractModal?: (id: number) => void;
    openChangeModal?: () => void;
    openCancelModal?: (id: number) => void;
    handlePrint: (order: any, type: 'label' | 'invoice') => void;
    statusBodyTemplate: (rowData: any) => React.ReactNode;
}

const formatDate = (dateStr: any) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        let hours = d.getHours();
        const period = hours < 12 ? '오전' : '오후';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${period} ${hours}:${min}`;
    } catch (e) {
        return String(dateStr);
    }
};

export const MultiOrderDetailModal: React.FC<MultiOrderDetailModalProps> = ({
    visible, onHide, order, orderDetailData, pipelineStages = [], pipelineSteps = [], advanceStage, advanceWorkOrderStage,
    openSubcontractModal, openChangeModal, openCancelModal, handlePrint, statusBodyTemplate
}) => {
    // Sliding Transition States
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
    const [selectedWorkOrderIndex, setSelectedWorkOrderIndex] = useState<number | null>(null);
    const [transitionDirection, setTransitionDirection] = useState<'none' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'>('none');
    const [animKey, setAnimKey] = useState<number>(0);
    const [imageZoomVisible, setImageZoomVisible] = useState<boolean>(false);

    if (!order) return null;
    const rowData = order;

    // Effective template steps
    const stepsToUse = (orderDetailData?.templateSteps && orderDetailData.templateSteps.length > 0)
        ? orderDetailData.templateSteps
        : (pipelineSteps && pipelineSteps.length > 0 ? pipelineSteps : []);

    const stagesList: string[] = stepsToUse.length > 0
        ? stepsToUse.map((s: any) => s.stageName || s.stageCode)
        : (pipelineStages && pipelineStages.length > 0 ? pipelineStages : []);

    // Work Orders list
    const workOrders = (orderDetailData?.workOrders && orderDetailData.workOrders.length > 0)
        ? orderDetailData.workOrders
        : [{
            id: rowData.id,
            workOrderNo: rowData.orderNo ? `${rowData.orderNo}-01` : `ORD-${rowData.id}-01`,
            stage: rowData.stage || (stagesList[0] || ''),
            createdAt: rowData.createdAt || rowData.date
        }];

    // Active item (when selected)
    const activeItem = selectedWorkOrder || {};
    const activeItemStage = activeItem.stage || rowData.stage || (stagesList[0] || '');
    const activeItemStageIdx = stagesList.indexOf(activeItemStage) >= 0 ? stagesList.indexOf(activeItemStage) : 0;

    // Stage counts for summary view
    const stageCounts: { [key: string]: number } = {};
    stagesList.forEach((st: string) => {
        stageCounts[st] = 0;
    });
    workOrders.forEach((wo: any) => {
        const st = wo.stage || (stagesList[0] || '');
        stageCounts[st] = (stageCounts[st] || 0) + 1;
    });

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

    const templateName = orderDetailData?.templateName || rowData.templateName || '표준 세공 공정';

    // Interactive Row Selection & Sliding Animation Handlers
    const handleRowClick = (wo: any, index: number) => {
        if (selectedWorkOrderIndex === null) {
            // Summary -> Item: Slide left
            setTransitionDirection('slide-left');
            setAnimKey(prev => prev + 1);
            setSelectedWorkOrder(wo);
            setSelectedWorkOrderIndex(index);
        } else if (selectedWorkOrderIndex === index) {
            // Clicking currently active item again: Slide right back to summary
            handleReturnToSummary();
        } else if (index > selectedWorkOrderIndex) {
            // Clicking item below: Slide up
            setTransitionDirection('slide-up');
            setAnimKey(prev => prev + 1);
            setSelectedWorkOrder(wo);
            setSelectedWorkOrderIndex(index);
        } else {
            // Clicking item above: Slide down
            setTransitionDirection('slide-down');
            setAnimKey(prev => prev + 1);
            setSelectedWorkOrder(wo);
            setSelectedWorkOrderIndex(index);
        }
    };

    const handleReturnToSummary = () => {
        setTransitionDirection('slide-right');
        setAnimKey(prev => prev + 1);
        setSelectedWorkOrder(null);
        setSelectedWorkOrderIndex(null);
    };

    return (
        <Dialog
            header={
                <div className="flex justify-content-between align-items-center w-full pr-4">
                    <div className="flex align-items-center gap-3">
                        <i className="pi pi-boxes text-primary text-2xl"></i>
                        <div>
                            <span className="text-xl font-bold text-900">다건 주문 상세 정보</span>
                            <span className="text-500 text-sm ml-2 font-mono">({rowData.orderNo || `KF-${rowData.id}`})</span>
                        </div>
                    </div>
                    <div className="flex gap-2 mr-4">
                        <Button
                            icon="pi pi-print"
                            label="라벨 인쇄"
                            onClick={() => handlePrint({ ...rowData, ...orderDetailData }, 'label')}
                            className="p-button-outlined p-button-secondary p-button-sm white-space-nowrap"
                        />
                        <Button
                            icon="pi pi-file-pdf"
                            label="주문명세서"
                            onClick={() => handlePrint({ ...rowData, ...orderDetailData }, 'invoice')}
                            className="p-button-outlined p-button-primary p-button-sm white-space-nowrap"
                        />
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            style={{ width: '920px', maxWidth: '95vw', maxHeight: '92vh' }}
            contentStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', overflowY: 'auto' }}
            modal
            dismissableMask
        >
            <style>{`
                @keyframes kfSlideLeftIn {
                    from { transform: translateX(80px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes kfSlideRightIn {
                    from { transform: translateX(-80px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes kfSlideUpIn {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes kfSlideDownIn {
                    from { transform: translateY(-40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes kfBackBtnAppear {
                    from { transform: scale(0.85); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .kf-slide-left {
                    animation: kfSlideLeftIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .kf-slide-right {
                    animation: kfSlideRightIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .kf-slide-up {
                    animation: kfSlideUpIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .kf-slide-down {
                    animation: kfSlideDownIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .kf-back-btn {
                    animation: kfBackBtnAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                /* Tracking Table Selected Row Styling */
                .kf-tracking-table .kf-item-row-selected {
                    background-color: #eff6ff !important;
                }
                .kf-tracking-table .kf-item-row-selected td {
                    background-color: #eff6ff !important;
                    color: #1e3a8a !important;
                }
                .kf-tracking-table .kf-item-row-selected td:first-child {
                    border-left: 4px solid #2563eb !important;
                    box-shadow: inset 2px 0 0 #2563eb;
                }
                .kf-tracking-table .kf-item-row-selected td * {
                    font-weight: 700 !important;
                }
                .kf-tracking-table .p-datatable-tbody > tr:not(.kf-item-row-selected):hover td {
                    background-color: #f8fafc !important;
                }
            `}</style>

            <div className="flex flex-column gap-3 py-1">

                {/* 1. Basic Info & Product Info Grid */}
                <div className="grid">
                    {/* Left: Order Basic Info */}
                    <div className="col-12 md:col-6">
                        <div className="surface-0 border-1 border-300 border-round p-3 h-full shadow-1 flex flex-column justify-content-between">
                            <div>
                                <div className="flex align-items-center justify-content-between border-bottom-1 border-200 pb-2 mb-3">
                                    <h3 className="m-0 text-800 text-sm font-bold flex align-items-center gap-2">
                                        <i className="pi pi-info-circle text-primary"></i> 주문 기본 정보
                                    </h3>
                                </div>
                                <div className="flex flex-column gap-2.5">
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-xs">주문 No.</span>
                                        <span className="text-primary font-bold font-mono text-sm">#{rowData.id}</span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-xs">주문 접수일시</span>
                                        <span className="text-800 font-medium text-xs">
                                            {formatDate(orderDetailData?.createdAt || rowData.createdAt || rowData.date)}
                                        </span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-xs">고객명 / 연락처</span>
                                        <span className="text-900 font-medium text-xs">
                                            {rowData.customerName || '고객 미지정'} {rowData.customerPhone && `(${rowData.customerPhone})`}
                                        </span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-xs">표면 마감</span>
                                        <span className="text-900 text-xs">{rowData.surfaceFinish || '유광'}</span>
                                    </div>
                                    <div className="flex justify-content-between align-items-center">
                                        <span className="text-600 text-xs">각인 문구</span>
                                        <span className="text-900 font-medium text-xs">
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
                        <div className="surface-0 border-1 border-300 border-round p-3 h-full shadow-1 flex flex-column justify-content-between">
                            <div>
                                <div className="flex align-items-center justify-content-between border-bottom-1 border-200 pb-2 mb-3">
                                    <h3 className="m-0 text-800 text-sm font-bold flex align-items-center gap-2">
                                        <i className="pi pi-tag text-orange-500"></i> 제품 정보
                                    </h3>
                                    <span className="font-bold text-700 text-xs">{orderDetailData?.quantity || rowData.quantity || workOrders.length}개</span>
                                </div>
                                <div className="flex gap-3 align-items-start">
                                    {(() => {
                                        const rawUrl = orderDetailData?.imageUrl || rowData.imageUrl;
                                        const imgSrc = formatImageUrl(rawUrl);
                                        return (
                                            <div className="flex align-items-center justify-content-center">
                                                {imgSrc ? (
                                                    <div
                                                        className="relative border-round shadow-2 border-1 border-300 cursor-pointer overflow-hidden flex align-items-center justify-content-center transition-all transition-duration-150 hover:shadow-4 surface-100"
                                                        style={{ width: '74px', height: '74px' }}
                                                        onClick={() => setImageZoomVisible(true)}
                                                        title="클릭하여 이미지 크게 보기"
                                                    >
                                                        <img
                                                            src={imgSrc}
                                                            alt="제품 미리보기"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="border-round border-1 border-300 surface-100 flex flex-column align-items-center justify-content-center text-400"
                                                        style={{ width: '74px', height: '74px' }}
                                                    >
                                                        <i className="pi pi-image text-2xl mb-1"></i>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    <div className="flex flex-column gap-2 flex-grow-1">
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600 text-xs">브랜드</span>
                                            <span className="text-900 font-bold text-xs">{orderDetailData?.brand || rowData.brand || '-'}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600 text-xs">제품명 (디자인)</span>
                                            <span className="text-900 font-medium text-xs">{orderDetailData?.productName || rowData.unmappedProductName || rowData.design || '-'}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600 text-xs">가격</span>
                                            <span className="text-green-600 font-bold text-xs">
                                                {rowData.finalConsumerPrice ? `₩${rowData.finalConsumerPrice.toLocaleString()}` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Process Timeline Section (Animated Sliding Stepper) */}
                <div className="surface-0 border-1 border-300 border-round p-3 shadow-1">
                    <div className="flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                        <div className="flex align-items-center gap-2">
                            <h3 className="m-0 text-800 text-sm font-bold flex align-items-center gap-2">
                                <i className="pi pi-sliders-h text-purple-500"></i> 공정 진행 타임라인
                            </h3>
                            {!selectedWorkOrder && (
                                <span className="text-500 text-xs font-normal">(전체 물건 요약)</span>
                            )}
                        </div>

                        <div className="flex align-items-center gap-1.5 text-xs bg-gray-100 border-round-2xl px-2.5 py-1">
                            <i className="pi pi-sitemap text-primary text-xs"></i>
                            <span className="text-500 font-normal">적용 템플릿</span>
                            <span className="text-400 font-normal">·</span>
                            <span className="text-800 font-bold">{templateName}</span>
                        </div>
                    </div>

                    {/* Timeline Box with Sliding Transitions */}
                    <div 
                        className="w-full surface-50 border-round border-1 border-200 overflow-hidden relative flex align-items-center"
                        style={{ minHeight: '130px', padding: '12px 16px' }}
                    >
                        {selectedWorkOrder ? (
                            /* Item View: Left back button + Item Stepper */
                            <div 
                                key={`item-${animKey}`}
                                className={`w-full flex align-items-center ${
                                    transitionDirection === 'slide-left' ? 'kf-slide-left' :
                                    transitionDirection === 'slide-up' ? 'kf-slide-up' :
                                    transitionDirection === 'slide-down' ? 'kf-slide-down' : ''
                                }`}
                            >
                                {/* Left Back Button */}
                                <div className="flex-shrink-0 flex flex-column justify-content-center align-items-center pr-4 border-right-1 border-300">
                                    <button
                                        type="button"
                                        onClick={handleReturnToSummary}
                                        className="kf-back-btn flex align-items-center gap-1.5 px-3 py-2 border-round-xl border-1 surface-border bg-white text-700 hover:text-primary hover:border-primary shadow-1 hover:shadow-2 transition-all cursor-pointer font-bold text-xs"
                                        style={{ whiteSpace: 'nowrap' }}
                                        title="전체 물건 요약으로 돌아가기"
                                    >
                                        <i className="pi pi-arrow-left text-xs font-bold text-primary"></i>
                                        <span>전체 요약</span>
                                    </button>
                                    <span className="text-500 font-mono text-xs mt-1.5 font-semibold">
                                        물건 #{selectedWorkOrderIndex !== null ? selectedWorkOrderIndex + 1 : 1}
                                    </span>
                                </div>

                                {/* Right: Selected Item Timeline Stepper */}
                                <div className="flex-1 flex justify-content-center align-items-center overflow-x-auto pl-4">
                                    <div className="flex align-items-center gap-4">
                                        {stagesList.map((st: string, idx: number) => {
                                            const isLast = idx === stagesList.length - 1;
                                            const isCompleted = idx <= activeItemStageIdx;
                                            const stepBg = getStepBgColor(st) || (isCompleted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0');

                                            return (
                                                <React.Fragment key={st}>
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
                                                            <i className={`${isCompleted ? 'pi pi-check' : 'pi pi-circle'} text-lg ${isCompleted ? 'text-white font-bold' : 'text-400'}`}></i>
                                                        </div>
                                                        <span className={`font-bold text-xs px-2.5 py-0.5 border-round shadow-1 bg-white ${isCompleted ? 'text-900' : 'text-500'}`}>
                                                            {st}
                                                        </span>
                                                        <div className="text-xs text-500 mt-1" style={{ whiteSpace: 'nowrap' }}>
                                                            {isCompleted ? formatDate(selectedWorkOrder.createdAt || rowData.createdAt) : '-'}
                                                        </div>
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
                        ) : (
                            /* Summary View: Centered Stepper with Stage Counts */
                            <div 
                                key={`summary-${animKey}`}
                                className={`w-full flex justify-content-center align-items-center overflow-x-auto ${
                                    transitionDirection === 'slide-right' ? 'kf-slide-right' : ''
                                }`}
                            >
                                <div className="flex align-items-center gap-4">
                                    {stagesList.map((st: string, idx: number) => {
                                        const count = stageCounts[st] || 0;
                                        const isLast = idx === stagesList.length - 1;
                                        const isCompleted = count > 0;
                                        const stepBg = getStepBgColor(st) || (isCompleted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0');

                                        return (
                                            <React.Fragment key={st}>
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
                                                        <span className={`text-xl font-bold ${count > 0 ? 'text-white drop-shadow' : 'text-400'}`}>
                                                            {count}
                                                        </span>
                                                    </div>
                                                    <span className={`font-bold text-xs px-2.5 py-0.5 border-round shadow-1 bg-white ${isCompleted ? 'text-900' : 'text-500'}`}>
                                                        {st}
                                                    </span>
                                                    <div className="text-xs text-500 mt-1" style={{ whiteSpace: 'nowrap', visibility: 'hidden' }}>
                                                        -
                                                    </div>
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
                        )}
                    </div>
                </div>

                {/* 3. Items Tracking Section */}
                <div className="surface-0 border-1 border-300 border-round p-3 shadow-1">
                    <div className="flex justify-content-between align-items-center mb-2">
                        <h3 className="m-0 text-800 text-sm font-bold flex align-items-center gap-2">
                            <i className="pi pi-list text-blue-500"></i> 개별 물건 트래킹
                            <span className="text-500 text-xs font-normal">
                                (총 {workOrders.length}개 물건)
                            </span>
                        </h3>
                        <span className="text-xs text-500">
                            💡 물건 행을 클릭하면 상단 타임라인이 해당 물건의 상세 이력으로 슬라이드 전환됩니다.
                        </span>
                    </div>

                    <DataTable
                        value={workOrders}
                        size="small"
                        stripedRows
                        scrollable
                        scrollHeight="220px"
                        className="p-datatable-sm kf-tracking-table"
                        rowHover
                        onRowClick={(e) => {
                            const target = e.originalEvent?.target as HTMLElement;
                            if (target && (target.closest('button') || target.closest('.p-button'))) {
                                return;
                            }
                            const idx = workOrders.findIndex((w: any) => 
                                w.id === e.data.id || (w.workOrderNo && w.workOrderNo === e.data.workOrderNo)
                            );
                            handleRowClick(e.data, idx >= 0 ? idx : 0);
                        }}
                        rowClassName={(data: any) => {
                            const isSelected = Boolean(
                                selectedWorkOrder && (
                                    selectedWorkOrder.id === data.id ||
                                    (selectedWorkOrder.workOrderNo && selectedWorkOrder.workOrderNo === data.workOrderNo)
                                )
                            );
                            return isSelected ? 'kf-item-row-selected' : 'cursor-pointer';
                        }}
                    >
                        <Column
                            field="workOrderNo"
                            header="물건 ID (바코드)"
                            body={(r: any) => {
                                const isSelected = Boolean(
                                    selectedWorkOrder && (
                                        selectedWorkOrder.id === r.id ||
                                        (selectedWorkOrder.workOrderNo && selectedWorkOrder.workOrderNo === r.workOrderNo)
                                    )
                                );
                                return (
                                    <div className={`flex align-items-center gap-2 font-mono text-xs cursor-pointer ${
                                        isSelected ? 'text-blue-700 font-bold' : 'text-primary font-medium'
                                    }`}>
                                        <i className={`pi ${isSelected ? 'pi-check-circle text-blue-600 font-bold' : 'pi-file'}`}></i>
                                        <span>{r.workOrderNo || `${rowData.orderNo}-01`}</span>
                                    </div>
                                );
                            }}
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
                            body={(r: any) => {
                                const isSelected = Boolean(
                                    selectedWorkOrder && (
                                        selectedWorkOrder.id === r.id ||
                                        (selectedWorkOrder.workOrderNo && selectedWorkOrder.workOrderNo === r.workOrderNo)
                                    )
                                );
                                return (
                                    <span className={`text-xs ${isSelected ? 'text-900 font-bold' : 'text-600 font-normal'}`}>
                                        {formatDate(r.createdAt || rowData.createdAt)}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            header="작업"
                            style={{ width: '130px' }}
                            body={(r: any) => {
                                const isDone = r.stage === '완료' || r.stage === 'COMPLETED' || r.stage === '완성' || Boolean(r.completedAt);
                                if (isDone) {
                                    return (
                                        <span className="text-xs text-green-600 font-bold flex align-items-center gap-1">
                                            <i className="pi pi-check-circle"></i> 공정 완료
                                        </span>
                                    );
                                }
                                return (
                                    <Button
                                        label="공정 진행"
                                        icon="pi pi-forward"
                                        severity="success"
                                        outlined
                                        size="small"
                                        className="p-button-xs text-xs py-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (advanceWorkOrderStage) {
                                                advanceWorkOrderStage(r.id);
                                            } else if (advanceStage) {
                                                advanceStage(r.id);
                                            }
                                        }}
                                    />
                                );
                            }}
                        />
                    </DataTable>
                </div>

                {/* 4. Bottom Action Bar */}
                <div className="flex justify-content-between align-items-center border-top-1 border-300 pt-2 mt-1">
                    <div className="flex gap-2">
                        {openChangeModal && (
                            <Button
                                icon="pi pi-file-edit"
                                label="주문 변경 요청"
                                severity="warning"
                                outlined
                                onClick={openChangeModal}
                                className="p-button-sm white-space-nowrap text-xs"
                            />
                        )}
                        {openCancelModal && (
                            <Button
                                icon="pi pi-times-circle"
                                label="주문 취소 요청"
                                severity="danger"
                                outlined
                                onClick={() => openCancelModal(rowData.id)}
                                className="p-button-sm white-space-nowrap text-xs"
                            />
                        )}
                    </div>
                    <Button
                        label="닫기"
                        icon="pi pi-times"
                        onClick={onHide}
                        className="p-button-secondary p-button-sm px-4 white-space-nowrap text-xs"
                    />
                </div>

            </div>

            {/* Image Zoom Dialog */}
            <Dialog 
                visible={imageZoomVisible} 
                onHide={() => setImageZoomVisible(false)} 
                header="제품 이미지 확대" 
                dismissableMask 
                modal
                style={{ width: '90vw', maxWidth: '640px' }}
            >
                {(() => {
                    const rawUrl = orderDetailData?.imageUrl || rowData.imageUrl;
                    const imgSrc = formatImageUrl(rawUrl);
                    return imgSrc ? (
                        <div className="flex justify-content-center align-items-center p-3">
                            <img src={imgSrc} alt="제품 이미지 확대" className="max-w-full max-h-30rem border-round shadow-3" />
                        </div>
                    ) : null;
                })()}
            </Dialog>
        </Dialog>
    );
};

export default MultiOrderDetailModal;
