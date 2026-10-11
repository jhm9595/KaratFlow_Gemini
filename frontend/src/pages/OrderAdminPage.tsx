import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Image } from 'primereact/image';
import { PipelineStatusBadge } from '../components/pipeline/PipelineStatusBadge';
import { formatImageUrl } from '../utils/image';

interface OrderAdminPageProps {
    orders: any[];
    onOpenOrderDetail: (id: number) => void;
    pipelineSteps?: any[];
    pipelineStages?: string[];
}

export const OrderAdminPage: React.FC<OrderAdminPageProps> = ({ orders, onOpenOrderDetail, pipelineSteps, pipelineStages }) => {
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedStage, setSelectedStage] = useState<string>('ALL');

    // Dynamically generate process stage options from the user's active ProcessTemplate
    const availableStages: string[] = (pipelineStages && pipelineStages.length > 0)
        ? pipelineStages
        : (pipelineSteps && pipelineSteps.length > 0)
            ? pipelineSteps.map((step: any) => step.stageName)
            : Array.from(new Set(orders.map(o => o.stage).filter(Boolean)));

    const stageOptions = [
        { label: '전체 공정 보기 (전체)', value: 'ALL' },
        ...availableStages.map((stageName: string) => ({
            label: stageName,
            value: stageName
        }))
    ];

    const filteredOrders = orders.filter(o => {
        const matchesGlobal = !globalFilter || 
            (o.orderNo || '').toLowerCase().includes(globalFilter.toLowerCase()) ||
            (o.customerName || '').toLowerCase().includes(globalFilter.toLowerCase()) ||
            (o.design || '').toLowerCase().includes(globalFilter.toLowerCase());
        
        const matchesStage = selectedStage === 'ALL' || !selectedStage || 
            (o.stage && o.stage.trim().toLowerCase() === selectedStage.trim().toLowerCase());

        return matchesGlobal && matchesStage;
    });

    return (
        <div className="p-4 surface-ground min-h-screen">
            <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                    <h2 className="text-900 font-bold m-0 flex align-items-center gap-2">
                        <i className="pi pi-shopping-bag text-primary text-2xl"></i>
                        전체 주문 관리
                    </h2>
                    <p className="text-500 text-sm mt-1 mb-0">
                        전체 주문 검색, 공정 상태 다중 필터링 및 엑셀 다운로드
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button label="엑셀 다운로드" icon="pi pi-file-excel" className="p-button-success p-button-sm shadow-1" />
                </div>
            </div>

            <Card className="border-round-xl shadow-1">
                {/* Search & Filter Bar */}
                <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                    <div className="p-inputgroup flex-1 max-w-25rem">
                        <span className="p-inputgroup-addon bg-surface-50 border-300">
                            <i className="pi pi-search text-600" />
                        </span>
                        <InputText 
                            value={globalFilter} 
                            onChange={(e) => setGlobalFilter(e.target.value)} 
                            placeholder="주문번호, 고객명, 디자인 검색..." 
                            className="p-inputtext-sm"
                        />
                    </div>

                    <div className="flex align-items-center gap-2">
                        <span className="text-700 font-bold text-sm">공정 필터:</span>
                        <Dropdown 
                            value={selectedStage} 
                            options={stageOptions} 
                            onChange={(e) => setSelectedStage(e.value)} 
                            className="p-inputtext-sm"
                        />
                    </div>
                </div>

                <DataTable value={filteredOrders} size="small" paginator rows={15} responsiveLayout="scroll" className="p-datatable-sm">
                    <Column header="" style={{ width: '52px' }} body={(row: any) => {
                        const imgUrl = formatImageUrl(row.imageUrl);
                        return imgUrl ? (
                            <div className="flex align-items-center justify-content-center">
                                <img 
                                    src={imgUrl} 
                                    alt="" 
                                    style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} 
                                    onError={(e: any) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline-block';
                                    }}
                                />
                                <span className="pi pi-image text-300" style={{ display: 'none' }} />
                            </div>
                        ) : <span className="pi pi-image text-300" />;
                    }} />
                    <Column header="주문 번호" body={(r) => <span className="font-bold text-primary">#{r.orderNo || r.id}</span>} />
                    <Column header="수량" style={{ width: '72px' }} body={(row: any) => <span className="font-bold text-700">{row.quantity ?? 1}건</span>} />
                    <Column field="design" header="제품명 (Design)" />
                    <Column field="customerName" header="고객명 (소매점)" body={(r) => <span className="font-bold text-800">{r.customerName}</span>} />
                    <Column field="orderType" header="주문구분" body={(r) => <span className="text-xs font-bold text-500">{r.orderType || 'B2C'}</span>} />
                    <Column 
                        field="stage" 
                        header="공정 상태" 
                        body={(rowData) => (
                            <PipelineStatusBadge 
                                rowData={rowData} 
                                pipelineSteps={pipelineSteps} 
                                pipelineStages={pipelineStages} 
                            />
                        )} 
                    />
                    <Column header="상세보기" body={(r) => (
                        <Button icon="pi pi-eye" className="p-button-rounded p-button-text p-button-sm" onClick={() => onOpenOrderDetail(r.id)} />
                    )} />
                </DataTable>
            </Card>
        </div>
    );
};
