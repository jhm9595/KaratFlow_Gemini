import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';

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

export const MultiOrderDetailModal: React.FC<MultiOrderDetailModalProps> = ({
    visible, onHide, order, orderDetailData, pipelineStages = ['접수', 'CAD', '주물', '세공', '완료'], pipelineSteps = [], advanceStage,
    openSubcontractModal, openChangeModal, openCancelModal, handlePrint, statusBodyTemplate
}) => {
    const [selectedTab, setSelectedTab] = useState(0);

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
                            <span className="text-500 text-sm ml-2">({rowData.orderNo || `KF-${rowData.id}`} - 총 {workOrders.length}개 물건)</span>
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
                            label="주문명세서"
                            onClick={() => handlePrint({ ...rowData, ...orderDetailData }, 'invoice')}
                            className="p-button-outlined p-button-primary p-button-sm"
                        />
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            style={{ width: '920px', maxWidth: '95vw' }}
            modal
            className="p-fluid"
        >
            <div className="flex flex-column gap-4 py-2">

                {/* 1. Basic Order Info Card */}
                <div className="surface-100 border-round p-3 flex justify-content-between align-items-center border-left-4 border-primary shadow-1">
                    <div>
                        <span className="text-500 text-xs block font-bold mb-1">고객명 / 연락처</span>
                        <span className="font-bold text-800 text-base">
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
                        <span className="text-700 text-sm font-semibold">{rowData.orderDate || rowData.createdAt || '-'}</span>
                    </div>
                </div>

                {/* 2. Multi-Item Timeline Section */}
                <div className="surface-0 border-1 border-300 border-round p-4 shadow-1">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h3 className="m-0 text-800 text-base font-bold flex align-items-center gap-2">
                            <i className="pi pi-sitemap text-primary"></i> 다건 공정 진행 타임라인
                        </h3>
                        <span className="text-xs text-500">
                            * 물건별 탭을 선택하여 개별 타임라인을 확인하세요.
                        </span>
                    </div>

                    <TabView activeIndex={selectedTab} onTabChange={(e) => setSelectedTab(e.index)}>
                        
                        {/* Overall Summary Tab */}
                        <TabPanel header="전체 공정 현황 요약" leftIcon="pi pi-chart-pie mr-2">
                            <div className="p-3 surface-50 border-round">
                                <h4 className="text-sm font-bold text-700 m-0 mb-3">단계별 물건 진행 분포</h4>
                                <div className="grid">
                                    {stagesList.map((st: string) => {
                                        const count = stageCounts[st] || 0;
                                        const bgStyle = getStepBgColor(st);
                                        return (
                                            <div key={st} className="col-12 md:col-2 text-center">
                                                <div 
                                                    className="p-3 border-round border-1 border-200 shadow-1 flex flex-column align-items-center gap-2"
                                                    style={bgStyle ? { background: bgStyle, color: '#ffffff' } : { backgroundColor: '#f8f9fa' }}
                                                >
                                                    <span className="text-xs font-bold">{st}</span>
                                                    <span className="text-xl font-extrabold">{count}개</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabPanel>

                        {/* Individual Work Order Tabs */}
                        {workOrders.map((wo: any, idx: number) => {
                            const itemStage = wo.stage || '접수';
                            const itemStageIdx = stagesList.indexOf(itemStage) >= 0 ? stagesList.indexOf(itemStage) : 0;

                            return (
                                <TabPanel key={wo.id || idx} header={`${wo.workOrderNo || `물건 #${idx+1}`} (${itemStage})`} leftIcon="pi pi-box mr-2">
                                    <div className="py-2">
                                        <div className="flex justify-content-between align-items-center mb-4">
                                            <span className="font-bold text-700 text-sm">
                                                물건 번호: <span className="text-primary font-mono">{wo.workOrderNo || `WO-${wo.id}`}</span>
                                            </span>
                                            <div className="flex align-items-center gap-2">
                                                <span className="text-xs text-500">현재 공정:</span>
                                                <Tag value={itemStage} severity="success" />
                                            </div>
                                        </div>

                                        {/* Individual Item Stage Stepper */}
                                        <div className="grid text-center relative py-2">
                                            {stagesList.map((st: string, stIdx: number) => {
                                                const isCompleted = stIdx <= itemStageIdx;
                                                const isCurrent = stIdx === itemStageIdx;
                                                const customBg = getStepBgColor(st);

                                                return (
                                                    <div key={st} className="col flex flex-column align-items-center relative z-1">
                                                        <div
                                                            className={`w-3rem h-3rem border-circle flex align-items-center justify-content-center text-white shadow-2 transition-all transition-duration-200 ${
                                                                isCurrent ? 'ring-2 ring-primary scale-110' : ''
                                                            }`}
                                                            style={{
                                                                background: isCompleted
                                                                    ? (customBg || '#22C55E')
                                                                    : '#E5E7EB',
                                                                color: isCompleted ? '#FFFFFF' : '#9CA3AF'
                                                            }}
                                                        >
                                                            <i className={`pi ${isCompleted ? 'pi-check text-xl font-bold' : 'pi-circle'} `} />
                                                        </div>
                                                        <span className={`text-xs font-bold mt-2 ${isCompleted ? 'text-900' : 'text-400'}`}>
                                                            {st}
                                                        </span>
                                                        {isCurrent && (
                                                            <span className="text-xs text-primary font-bold mt-1">(현재 진행중)</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </TabPanel>
                            );
                        })}
                    </TabView>
                </div>

                {/* 3. Items Tracking Section */}
                <div className="surface-0 border-1 border-300 border-round p-4 shadow-1">
                    <h3 className="m-0 mb-3 text-800 text-base font-bold flex align-items-center gap-2">
                        <i className="pi pi-list text-blue-500"></i> 개별 물건 트래킹 
                        <span className="text-500 text-xs font-normal">
                            (총 {workOrders.length}개 물건 상세)
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
                                    {r.createdAt || rowData.createdAt || '-'}
                                </span>
                            )}
                        />
                        <Column
                            header="작업"
                            body={(r: any) => (
                                <div className="flex gap-1">
                                    {advanceStage && (
                                        <Button
                                            icon="pi pi-step-forward"
                                            label="공정 진행"
                                            className="p-button-xs p-button-outlined p-button-success"
                                            onClick={() => advanceStage(r.id)}
                                        />
                                    )}
                                </div>
                            )}
                        />
                    </DataTable>
                </div>

                {/* 4. Action Buttons Footer */}
                <div className="flex justify-content-between align-items-center pt-2">
                    <div className="flex gap-2">
                        {openChangeModal && (
                            <Button
                                icon="pi pi-file-edit"
                                label="주문 변경 요청"
                                severity="warning"
                                onClick={openChangeModal}
                                className="p-button-sm"
                            />
                        )}
                        {openCancelModal && (
                            <Button
                                icon="pi pi-times-circle"
                                label="주문 취소 요청"
                                severity="danger"
                                onClick={() => openCancelModal(rowData.id)}
                                className="p-button-sm"
                            />
                        )}
                    </div>
                    <Button
                        label="닫기"
                        icon="pi pi-check"
                        onClick={onHide}
                        className="p-button-secondary p-button-sm px-4"
                    />
                </div>
            </div>
        </Dialog>
    );
};
