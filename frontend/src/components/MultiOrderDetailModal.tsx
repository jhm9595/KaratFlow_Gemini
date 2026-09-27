import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

interface MultiOrderDetailModalProps {
    visible: boolean;
    onHide: () => void;
    order: any;
    orderDetailData: any;
    pipelineStages?: string[];
    pipelineSteps?: any[];
    advanceStage?: (id: number) => void;
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

export const MultiOrderDetailModal: React.FC<MultiOrderDetailModalProps> = ({
    visible, onHide, order, orderDetailData, pipelineStages = ['접수', 'CAD', '주물', '세공', '완료'], pipelineSteps = [], advanceStage,
    openSubcontractModal, openChangeModal, openCancelModal, handlePrint, statusBodyTemplate
}) => {
    const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);

    if (!order) return null;
    const rowData = order;
    const stagesList = pipelineStages && pipelineStages.length > 0 ? pipelineStages : ['접수', 'CAD', '주물', '세공', '완료'];

    // Work Orders list
    const workOrders = (orderDetailData?.workOrders && orderDetailData.workOrders.length > 0)
        ? orderDetailData.workOrders
        : [{
            id: rowData.id,
            workOrderNo: rowData.orderNo || `WO-${rowData.id}`,
            stage: rowData.stage || '접수',
            createdAt: rowData.createdAt || rowData.date
        }];

    // Calculate stage distribution count for summary
    const stageCounts: { [key: string]: number } = {};
    workOrders.forEach((wo: any) => {
        const st = wo.stage || '접수';
        stageCounts[st] = (stageCounts[st] || 0) + 1;
    });

    // Filter work orders by stage if selected
    const filteredWorkOrders = selectedStageFilter === 'ALL'
        ? workOrders
        : workOrders.filter((wo: any) => (wo.stage || '접수') === selectedStageFilter);

    // Active item for timeline stepper (defaults to selectedWorkOrder or first item)
    const activeItem = selectedWorkOrder || workOrders[0] || {};
    const activeItemStage = activeItem.stage || rowData.stage || '접수';
    const activeItemStageIdx = stagesList.indexOf(activeItemStage) >= 0 ? stagesList.indexOf(activeItemStage) : 0;

    const getStepBgColor = (stageName: string) => {
        if (!pipelineSteps || pipelineSteps.length === 0) return null;
        let matched = pipelineSteps.find((step: any) => step.stageName === stageName);
        if (!matched) {
            matched = pipelineSteps.find((step: any) =>
                step.stageName && step.stageName.trim().toLowerCase() === stageName.trim().toLowerCase()
            );
        }
        if (!matched) {
            if (stageName === 'COMPLETED' || stageName === 'DONE' || stageName === '완성') {
                matched = pipelineSteps.find((step: any) => step.stageName === '완료' || step.stageName === 'COMPLETED');
            } else if (stageName === 'PENDING') {
                matched = pipelineSteps.find((step: any) => step.stageName === '접수' || step.stageName === 'PENDING');
            }
        }
        return matched ? (matched.colorGradient || matched.colorHex) : null;
    };

    return (
        <Dialog
            header={
                <div className="flex justify-content-between align-items-center w-full pr-4">
                    <div className="flex align-items-center gap-3">
                        <i className="pi pi-boxes text-primary text-2xl"></i>
                        <div>
                            <span className="text-xl font-bold text-900">다건 주문 상세 정보</span>
                            <span className="text-500 text-sm ml-2">({rowData.orderNo || `KF-${rowData.id}`} · 총 {workOrders.length}개 물건)</span>
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
            style={{ width: '920px', maxWidth: '95vw' }}
            modal
            dismissableMask
        >
            <div className="flex flex-column gap-3 py-2">

                {/* 1. Basic Order Info Card */}
                <div className="surface-100 border-round p-3 flex flex-wrap justify-content-between align-items-center border-left-4 border-primary shadow-1 gap-2">
                    <div>
                        <span className="text-500 text-xs block font-bold mb-1">고객명 / 연락처</span>
                        <span className="font-bold text-800 text-sm">
                            {rowData.customerName || '고객 미지정'} ({rowData.customerPhone || '연락처 미지정'})
                        </span>
                    </div>
                    <div>
                        <span className="text-500 text-xs block font-bold mb-1">주문 유형</span>
                        <Tag value={rowData.orderType || '일반주문'} severity="info" />
                    </div>
                    <div>
                        <span className="text-500 text-xs block font-bold mb-1">총 물건 수량</span>
                        <Tag value={`${workOrders.length}개 물건`} severity="warning" className="font-bold" />
                    </div>
                    <div>
                        <span className="text-500 text-xs block font-bold mb-1">주문 일시</span>
                        <span className="text-700 text-sm font-semibold">
                            {formatDate(rowData.orderDate || rowData.createdAt)}
                        </span>
                    </div>
                </div>

                {/* 2. Overall Pipeline Progress Summary */}
                <div className="surface-0 border-1 border-300 border-round p-3 shadow-1">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h3 className="m-0 text-800 text-sm font-bold flex align-items-center gap-2">
                            <i className="pi pi-chart-pie text-primary"></i> 전체 공정 현황 요약
                        </h3>
                        <span className="text-xs text-500">* 카드를 클릭하면 해당 공정의 물건만 필터링됩니다.</span>
                    </div>

                    <div className="grid grid-nogutter gap-2">
                        <div 
                            className={`col surface-50 p-2 border-round border-1 text-center cursor-pointer transition-colors ${selectedStageFilter === 'ALL' ? 'border-primary bg-blue-50' : 'border-200 hover:surface-100'}`}
                            onClick={() => setSelectedStageFilter('ALL')}
                        >
                            <span className="text-xs text-600 block font-bold">전체 물건</span>
                            <span className="text-lg font-extrabold text-900">{workOrders.length}개</span>
                        </div>
                        {stagesList.map((st: string) => {
                            const count = stageCounts[st] || 0;
                            const isSelected = selectedStageFilter === st;
                            return (
                                <div
                                    key={st}
                                    className={`col surface-50 p-2 border-round border-1 text-center cursor-pointer transition-colors ${isSelected ? 'border-primary bg-blue-50' : 'border-200 hover:surface-100'}`}
                                    onClick={() => setSelectedStageFilter(isSelected ? 'ALL' : st)}
                                >
                                    <span className="text-xs text-600 block font-bold">{st}</span>
                                    <span className={`text-lg font-extrabold ${count > 0 ? 'text-primary' : 'text-400'}`}>{count}개</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Items List & Individual Tracking Table */}
                <div className="surface-0 border-1 border-300 border-round p-3 shadow-1">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h3 className="m-0 text-800 text-sm font-bold flex align-items-center gap-2">
                            <i className="pi pi-list text-blue-500"></i> 개별 물건 트래킹
                            <span className="text-500 text-xs font-normal">
                                ({filteredWorkOrders.length}개 / 총 {workOrders.length}개)
                            </span>
                        </h3>
                        {selectedStageFilter !== 'ALL' && (
                            <Button 
                                label="필터 해제" 
                                icon="pi pi-filter-slash" 
                                className="p-button-text p-button-xs text-500" 
                                onClick={() => setSelectedStageFilter('ALL')} 
                            />
                        )}
                    </div>

                    <DataTable
                        value={filteredWorkOrders}
                        size="small"
                        stripedRows
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        paginator={filteredWorkOrders.length > 5}
                        rows={5}
                        rowsPerPageOptions={[5, 10, 20]}
                        selectionMode="single"
                        selection={selectedWorkOrder}
                        onSelectionChange={(e) => setSelectedWorkOrder(e.value)}
                        metaKeySelection={false}
                    >
                        <Column
                            field="workOrderNo"
                            header="물건 ID (바코드)"
                            body={(r: any) => (
                                <div className="flex align-items-center gap-2 font-mono font-bold text-primary text-xs">
                                    <i className="pi pi-file"></i> {r.workOrderNo || `WO-${r.id}`}
                                </div>
                            )}
                        />
                        <Column
                            field="stage"
                            header="현재 공정 상태"
                            body={(r: any) => statusBodyTemplate(r)}
                        />
                        <Column
                            field="createdAt"
                            header="공정 투입 일시"
                            body={(r: any) => (
                                <span className="text-600 text-xs">
                                    {formatDate(r.createdAt || rowData.createdAt)}
                                </span>
                            )}
                        />
                        <Column
                            header="작업"
                            body={(r: any) => (
                                <div className="flex gap-1">
                                    {advanceStage && (
                                        <Button
                                            icon="pi pi-forward"
                                            label="공정 진행"
                                            className="p-button-xs p-button-outlined p-button-success white-space-nowrap"
                                            onClick={() => advanceStage(r.id || rowData.id)}
                                        />
                                    )}
                                </div>
                            )}
                        />
                    </DataTable>
                </div>

                {/* 4. Active Item Individual Timeline Stepper */}
                <div className="surface-0 border-1 border-300 border-round p-3 shadow-1">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h3 className="m-0 text-800 text-sm font-bold flex align-items-center gap-2">
                            <i className="pi pi-sliders-h text-purple-500"></i> 선택한 물건 공정 타임라인
                        </h3>
                        <span className="text-xs text-500 font-mono font-bold">
                            {activeItem.workOrderNo || `WO-${activeItem.id || rowData.id}`} ({activeItemStage})
                        </span>
                    </div>

                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 px-2 py-2 surface-50 border-round border-1 border-200">
                        {stagesList.map((st: string, stIdx: number) => {
                            const isCompleted = stIdx <= activeItemStageIdx;
                            const isCurrent = stIdx === activeItemStageIdx;
                            const stepBg = getStepBgColor(st) || (isCompleted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0');

                            return (
                                <React.Fragment key={st}>
                                    <div className="flex flex-column align-items-center p-1 text-center" style={{ minWidth: '80px' }}>
                                        <div
                                            className={`w-2rem h-2rem border-circle flex align-items-center justify-content-center shadow-1 mb-1 ${isCurrent ? 'ring-2 ring-primary scale-110' : ''}`}
                                            style={{ background: isCompleted ? stepBg : '#e2e8f0' }}
                                        >
                                            <i className={`${isCompleted ? 'pi pi-check' : 'pi pi-circle'} text-xs ${isCompleted ? 'text-white font-bold' : 'text-400'}`}></i>
                                        </div>
                                        <div className={`font-bold text-xs ${isCompleted ? 'text-900' : 'text-500'}`}>{st}</div>
                                        {isCurrent && <span className="text-xs text-primary font-bold">(진행중)</span>}
                                    </div>
                                    {stIdx < stagesList.length - 1 && (
                                        <div className="flex-1 flex align-items-center justify-content-center" style={{ minWidth: '20px' }}>
                                            <i className="pi pi-chevron-right text-400 text-xs"></i>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* 5. Bottom Action Bar */}
                <div className="flex justify-content-between align-items-center border-top-1 border-300 pt-3 mt-1">
                    <div className="flex gap-2">
                        {openChangeModal && (
                            <Button
                                icon="pi pi-file-edit"
                                label="주문 변경 요청"
                                severity="warning"
                                outlined
                                onClick={openChangeModal}
                                className="p-button-sm white-space-nowrap"
                            />
                        )}
                        {openCancelModal && (
                            <Button
                                icon="pi pi-times-circle"
                                label="주문 취소 요청"
                                severity="danger"
                                outlined
                                onClick={() => openCancelModal(rowData.id)}
                                className="p-button-sm white-space-nowrap"
                            />
                        )}
                    </div>
                    <Button
                        label="닫기"
                        icon="pi pi-times"
                        onClick={onHide}
                        className="p-button-secondary p-button-sm px-4 white-space-nowrap"
                    />
                </div>

            </div>
        </Dialog>
    );
};
