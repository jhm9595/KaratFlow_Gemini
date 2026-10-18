import React, { useState, useMemo } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { PipelineStatusBadge } from '../components/pipeline/PipelineStatusBadge';
import { formatImageUrl } from '../utils/image';
import { 
    ORDER_STATUS, 
    isOrderCancelled, 
    isOrderCompleted, 
    isOrderProcessing 
} from '../utils/orderStatus';

interface OrderAdminPageProps {
    orders: any[];
    templates?: any[];
    onOpenOrderDetail: (id: number) => void;
    pipelineSteps?: any[];
    pipelineStages?: string[];
}

export const OrderAdminPage: React.FC<OrderAdminPageProps> = ({ 
    orders, 
    templates = [],
    onOpenOrderDetail, 
    pipelineSteps, 
    pipelineStages 
}) => {
    // Form Input States
    const [templateFilter, setTemplateFilter] = useState<string | number>(ORDER_STATUS.ALL);
    const [stageFilter, setStageFilter] = useState<string>(ORDER_STATUS.ALL);
    const [statusFilter, setStatusFilter] = useState<string>(ORDER_STATUS.ALL);
    const [searchKeyword, setSearchKeyword] = useState<string>('');

    // Applied Filter States (triggered by "조회" or Enter)
    const [appliedFilters, setAppliedFilters] = useState<{
        template: string | number;
        stage: string;
        status: string;
        keyword: string;
    }>({
        template: ORDER_STATUS.ALL,
        stage: ORDER_STATUS.ALL,
        status: ORDER_STATUS.ALL,
        keyword: ''
    });


    // 1. Template dropdown options
    const templateOptions = useMemo(() => {
        const opts = [
            { label: '전체 (모든 템플릿)', value: ORDER_STATUS.ALL }
        ];
        if (templates && templates.length > 0) {
            templates.forEach(t => {
                opts.push({
                    label: t.templateName || `템플릿 #${t.id}`,
                    value: t.id
                });
            });
        } else {
            // Fallback: extract distinct template names from orders
            const distinctTpls = Array.from(new Set(orders.map(o => o.templateName).filter(Boolean)));
            distinctTpls.forEach(name => {
                opts.push({ label: name, value: name });
            });
        }
        return opts;
    }, [templates, orders]);

    // 2. Stage options based on selected template (Pure process stages only)
    const stageOptions = useMemo(() => {
        let availableStages: string[] = [];

        if (templateFilter === ORDER_STATUS.ALL) {
            // All templates union of stages + pipelineStages
            const fromTemplates = (templates || []).flatMap(t => (t.steps || []).map((s: any) => s.stageName)).filter(Boolean);
            const fromPipeline = (pipelineStages && pipelineStages.length > 0)
                ? pipelineStages
                : (pipelineSteps && pipelineSteps.length > 0 ? pipelineSteps.map((s: any) => s.stageName) : []);
            const fromOrders = orders
                .filter(o => !isOrderCancelled(o))
                .map(o => o.stage)
                .filter(s => Boolean(s) && !isOrderCancelled({ status: s, stage: s }) && !isOrderCompleted({ status: s, stage: s }));
            availableStages = Array.from(new Set([...fromTemplates, ...fromPipeline, ...fromOrders]));
        } else {
            // Specific template stages
            const currentTpl = (templates || []).find(t => t.id === templateFilter);
            if (currentTpl && currentTpl.steps && currentTpl.steps.length > 0) {
                availableStages = currentTpl.steps.map((s: any) => s.stageName || s.stageCode).filter(Boolean);
            } else {
                // If template id not found in templates array, check orders
                const matchedOrder = orders.find(o => o.templateId === templateFilter || o.templateName === templateFilter);
                if (matchedOrder && matchedOrder.templateSteps) {
                    availableStages = matchedOrder.templateSteps.map((s: any) => s.stageName || s.stageCode).filter(Boolean);
                }
            }
        }

        return [
            { label: '전체 (모든 공정)', value: ORDER_STATUS.ALL },
            ...availableStages.map((stage: string) => ({
                label: stage,
                value: stage
            }))
        ];
    }, [templateFilter, templates, pipelineStages, pipelineSteps, orders]);

    // 3. Status dropdown options (Separated lifecycle status)
    const statusOptions = useMemo(() => [
        { label: '전체 (모든 상태)', value: ORDER_STATUS.ALL },
        { label: '진행중 (접수/생산)', value: ORDER_STATUS.PROCESSING },
        { label: '완료', value: ORDER_STATUS.COMPLETED },
        { label: '취소', value: ORDER_STATUS.CANCELLED }
    ], []);

    // Handle template dropdown change
    const handleTemplateChange = (val: string | number) => {
        setTemplateFilter(val);
        // Reset stage if current stage is not valid in new template
        if (stageFilter !== ORDER_STATUS.ALL) {
            let validStages: string[] = [];
            if (val === ORDER_STATUS.ALL) {
                validStages = (templates || []).flatMap(t => (t.steps || []).map((s: any) => s.stageName)).filter(Boolean);
            } else {
                const cur = (templates || []).find(t => t.id === val);
                validStages = (cur?.steps || []).map((s: any) => s.stageName || s.stageCode).filter(Boolean);
            }
            if (!validStages.includes(stageFilter)) {
                setStageFilter(ORDER_STATUS.ALL);
            }
        }
    };

    // Handle "조회" (Search)
    const handleSearch = () => {
        setAppliedFilters({
            template: templateFilter,
            stage: stageFilter,
            status: statusFilter,
            keyword: searchKeyword
        });
    };

    // Handle "초기화" (Reset)
    const handleReset = () => {
        setTemplateFilter(ORDER_STATUS.ALL);
        setStageFilter(ORDER_STATUS.ALL);
        setStatusFilter(ORDER_STATUS.ALL);
        setSearchKeyword('');
        setAppliedFilters({
            template: ORDER_STATUS.ALL,
            stage: ORDER_STATUS.ALL,
            status: ORDER_STATUS.ALL,
            keyword: ''
        });
    };

    // Filter orders according to appliedFilters
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            // 1. Template Filter
            if (appliedFilters.template !== ORDER_STATUS.ALL) {
                const matchesId = o.templateId === appliedFilters.template;
                const curTpl = (templates || []).find(t => t.id === appliedFilters.template);
                const matchesName = curTpl && o.templateName === curTpl.templateName;
                if (!matchesId && !matchesName) {
                    return false;
                }
            }

            // 2. Order Status Filter (Lifecycle: PROCESSING / COMPLETED / CANCELLED)
            if (appliedFilters.status !== ORDER_STATUS.ALL) {
                if (appliedFilters.status === ORDER_STATUS.CANCELLED && !isOrderCancelled(o)) return false;
                if (appliedFilters.status === ORDER_STATUS.COMPLETED && !isOrderCompleted(o)) return false;
                if (appliedFilters.status === ORDER_STATUS.PROCESSING && !isOrderProcessing(o)) return false;
            }

            // 3. Stage Filter (Pure physical process stage)
            if (appliedFilters.stage !== ORDER_STATUS.ALL) {
                const selectedStage = appliedFilters.stage.trim().toLowerCase();
                const orderStage = (o.stage || '').trim().toLowerCase();
                if (orderStage !== selectedStage) {
                    return false;
                }
            }

            // 4. Search Keyword
            if (appliedFilters.keyword) {
                const kw = appliedFilters.keyword.toLowerCase().trim();
                const matchesNo = (o.orderNo || '').toLowerCase().includes(kw) || (`#${o.id}`.includes(kw));
                const matchesCust = (o.customerName || '').toLowerCase().includes(kw);
                const matchesProd = (o.design || '').toLowerCase().includes(kw) || (o.unmappedProductName || '').toLowerCase().includes(kw);
                const matchesBrand = (o.brand || '').toLowerCase().includes(kw);
                if (!matchesNo && !matchesCust && !matchesProd && !matchesBrand) {
                    return false;
                }
            }

            return true;
        });
    }, [orders, appliedFilters, templates]);

    const totalCount = filteredOrders.length;
    const processingCount = filteredOrders.filter(o => isOrderProcessing(o)).length;
    const completedCount = filteredOrders.filter(o => isOrderCompleted(o)).length;
    const cancelledCount = filteredOrders.filter(o => isOrderCancelled(o)).length;


    return (
        <div className="p-4 surface-ground min-h-screen">
            {/* Page Header */}
            <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div>
                    <h2 className="text-900 font-bold m-0 flex align-items-center gap-2">
                        <i className="pi pi-shopping-bag text-primary text-2xl"></i>
                        전체 주문 관리
                    </h2>
                    <p className="text-500 text-sm mt-1 mb-0">
                        전체 주문 내역 조회, 공정 템플릿 및 상태별 다중 조건 필터링
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button label="엑셀 다운로드" icon="pi pi-file-excel" className="p-button-success p-button-sm shadow-1" />
                </div>
            </div>

            {/* Filter Panel (라벨 : 선택값 구성) */}
            <div className="surface-0 border-1 border-300 border-round-xl p-3 mb-3 shadow-1">
                <div className="flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="flex flex-wrap align-items-center gap-3">
                        {/* 템플릿 유형 */}
                        <div className="flex align-items-center gap-2">
                            <span className="text-700 font-semibold text-sm whitespace-nowrap">
                                템플릿 :
                            </span>
                            <Dropdown 
                                value={templateFilter} 
                                options={templateOptions} 
                                onChange={(e) => handleTemplateChange(e.value)} 
                                className="p-inputtext-sm w-11rem"
                                placeholder="템플릿 선택"
                            />
                        </div>

                        {/* 공정 단계 */}
                        <div className="flex align-items-center gap-2">
                            <span className="text-700 font-semibold text-sm whitespace-nowrap">
                                공정 단계 :
                            </span>
                            <Dropdown 
                                value={stageFilter} 
                                options={stageOptions} 
                                onChange={(e) => setStageFilter(e.value)} 
                                className="p-inputtext-sm w-10rem"
                                placeholder="공정단계 선택"
                            />
                        </div>

                        {/* 주문 상태 (진행중 / 완료 / 취소) */}
                        <div className="flex align-items-center gap-2">
                            <span className="text-700 font-semibold text-sm whitespace-nowrap">
                                주문 상태 :
                            </span>
                            <Dropdown 
                                value={statusFilter} 
                                options={statusOptions} 
                                onChange={(e) => setStatusFilter(e.value)} 
                                className="p-inputtext-sm w-10rem"
                                placeholder="주문상태 선택"
                            />
                        </div>

                        {/* 검색어 */}
                        <div className="flex align-items-center gap-2">
                            <span className="text-700 font-semibold text-sm whitespace-nowrap">
                                검색어 :
                            </span>
                            <div className="p-inputgroup w-14rem">
                                <span className="p-inputgroup-addon bg-surface-50 border-300 py-1 px-2">
                                    <i className="pi pi-search text-500 text-xs" />
                                </span>
                                <InputText 
                                    value={searchKeyword} 
                                    onChange={(e) => setSearchKeyword(e.target.value)} 
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                    placeholder="주문번호, 고객명, 제품명..." 
                                    className="p-inputtext-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons: 초기화 & 조회 */}
                    <div className="flex align-items-center gap-2 ml-auto">
                        <Button 
                            label="초기화" 
                            icon="pi pi-refresh" 
                            className="p-button-outlined p-button-secondary p-button-sm font-semibold"
                            onClick={handleReset}
                            tooltip="조회 조건 초기화"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <Button 
                            label="조회" 
                            icon="pi pi-search" 
                            className="p-button-primary p-button-sm font-bold px-3 shadow-1"
                            onClick={handleSearch}
                            tooltip="조건으로 주문 검색"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                    </div>
                </div>
            </div>

            {/* Results Table Card */}
            <Card className="border-round-xl shadow-1">
                <div className="flex flex-wrap align-items-center justify-content-between mb-2 gap-2">
                    <div className="flex flex-wrap align-items-center gap-2">
                        <span className="text-700 text-sm font-semibold">
                            총 <strong className="text-900 font-bold">{totalCount}</strong>건
                        </span>
                        <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 border-round border-1 border-blue-200">
                            진행중 <strong>{processingCount}</strong>건
                        </span>
                        <span className="text-xs text-green-700 font-semibold bg-green-50 px-2 py-1 border-round border-1 border-green-200">
                            완료 <strong>{completedCount}</strong>건
                        </span>
                        {cancelledCount > 0 && (
                            <span className="text-xs text-red-700 font-semibold bg-red-50 px-2 py-1 border-round border-1 border-red-200">
                                취소 <strong>{cancelledCount}</strong>건
                            </span>
                        )}
                    </div>
                </div>

                <DataTable 
                    value={filteredOrders} 
                    size="small" 
                    paginator 
                    rows={15} 
                    responsiveLayout="scroll" 
                    className="p-datatable-sm"
                    emptyMessage="조회 조건에 맞는 주문 내역이 없습니다."
                >
                    <Column 
                        header="No." 
                        style={{ width: '48px', textAlign: 'center' }} 
                        body={(_rowData, options) => (
                            <span className="font-mono text-xs text-500 font-medium">
                                {(options.rowIndex !== undefined ? options.rowIndex : 0) + 1}
                            </span>
                        )}
                    />
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
                    <Column 
                        header="주문일자" 
                        field="date" 
                        style={{ width: '105px' }} 
                        body={(r) => <span className="text-600 text-sm">{r.date || '-'}</span>} 
                    />
                    <Column 
                        header="주문 No." 
                        field="id" 
                        style={{ width: '85px' }} 
                        body={(r) => (
                            <span className="font-bold text-primary font-mono" title={r.orderNo}>
                                #{r.id}
                            </span>
                        )} 
                    />
                    <Column 
                        header="공정 템플릿" 
                        field="templateName" 
                        style={{ width: '120px' }} 
                        body={(r) => (
                            <span className="text-700 text-xs font-semibold px-2 py-1 surface-100 border-round">
                                {r.templateName || '기본 공정'}
                            </span>
                        )} 
                    />
                    <Column 
                        field="design" 
                        header="제품명 (Design)" 
                        body={(r) => {
                            const title = r.design || r.unmappedProductName || '-';
                            return (
                                <div className="flex align-items-center gap-2">
                                    <span className="font-medium text-800">{title}</span>
                                    {r.quantity && r.quantity > 1 && (
                                        <span 
                                            className="px-2 py-0 border-round bg-blue-50 text-blue-700 text-xs font-semibold border-1 border-blue-200"
                                            title={`총 ${r.quantity}개 물건`}
                                        >
                                            {r.quantity}개
                                        </span>
                                    )}
                                </div>
                            );
                        }} 
                    />
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
