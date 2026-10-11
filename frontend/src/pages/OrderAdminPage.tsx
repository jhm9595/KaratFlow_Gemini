import React, { useState, useMemo } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { PipelineStatusBadge } from '../components/pipeline/PipelineStatusBadge';
import { formatImageUrl } from '../utils/image';

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
    const [templateFilter, setTemplateFilter] = useState<string | number>('ALL');
    const [stageFilter, setStageFilter] = useState<string>('ALL');
    const [searchKeyword, setSearchKeyword] = useState<string>('');

    // Applied Filter States (triggered by "조회" or Enter)
    const [appliedFilters, setAppliedFilters] = useState<{
        template: string | number;
        stage: string;
        keyword: string;
    }>({
        template: 'ALL',
        stage: 'ALL',
        keyword: ''
    });

    // 1. Template dropdown options
    const templateOptions = useMemo(() => {
        const opts = [
            { label: '전체 (모든 템플릿)', value: 'ALL' }
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

    // 2. Stage options based on selected template (+ 취소)
    const stageOptions = useMemo(() => {
        let availableStages: string[] = [];

        if (templateFilter === 'ALL') {
            // All templates union of stages + pipelineStages
            const fromTemplates = (templates || []).flatMap(t => (t.steps || []).map((s: any) => s.stageName)).filter(Boolean);
            const fromPipeline = (pipelineStages && pipelineStages.length > 0)
                ? pipelineStages
                : (pipelineSteps && pipelineSteps.length > 0 ? pipelineSteps.map((s: any) => s.stageName) : []);
            const fromOrders = orders.map(o => o.stage).filter(s => Boolean(s) && s !== '취소' && s !== 'CANCELLED');
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

        const opts = [
            { label: '전체 (모든 공정)', value: 'ALL' },
            ...availableStages.map((stage: string) => ({
                label: stage,
                value: stage
            })),
            { label: '취소', value: '취소' }
        ];

        return opts;
    }, [templateFilter, templates, pipelineStages, pipelineSteps, orders]);

    // Handle template dropdown change
    const handleTemplateChange = (val: string | number) => {
        setTemplateFilter(val);
        // Reset stage if current stage is not valid in new template
        if (stageFilter !== 'ALL' && stageFilter !== '취소') {
            let validStages: string[] = [];
            if (val === 'ALL') {
                validStages = (templates || []).flatMap(t => (t.steps || []).map((s: any) => s.stageName)).filter(Boolean);
            } else {
                const cur = (templates || []).find(t => t.id === val);
                validStages = (cur?.steps || []).map((s: any) => s.stageName || s.stageCode).filter(Boolean);
            }
            if (!validStages.includes(stageFilter)) {
                setStageFilter('ALL');
            }
        }
    };

    // Handle "조회" (Search)
    const handleSearch = () => {
        setAppliedFilters({
            template: templateFilter,
            stage: stageFilter,
            keyword: searchKeyword
        });
    };

    // Handle "초기화" (Reset)
    const handleReset = () => {
        setTemplateFilter('ALL');
        setStageFilter('ALL');
        setSearchKeyword('');
        setAppliedFilters({
            template: 'ALL',
            stage: 'ALL',
            keyword: ''
        });
    };

    // Filter orders according to appliedFilters
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            // 1. Template Filter
            if (appliedFilters.template !== 'ALL') {
                const matchesId = o.templateId === appliedFilters.template;
                const curTpl = (templates || []).find(t => t.id === appliedFilters.template);
                const matchesName = curTpl && o.templateName === curTpl.templateName;
                if (!matchesId && !matchesName) {
                    return false;
                }
            }

            // 2. Stage Filter
            if (appliedFilters.stage !== 'ALL') {
                const isOrderCancelled = o.status === 'CANCELLED' || o.status === '취소' || o.stage === 'CANCELLED' || o.stage === '취소';
                if (appliedFilters.stage === '취소') {
                    if (!isOrderCancelled) return false;
                } else {
                    if (isOrderCancelled) return false;
                    if (!o.stage || o.stage.trim().toLowerCase() !== appliedFilters.stage.trim().toLowerCase()) {
                        return false;
                    }
                }
            }

            // 3. Search Keyword
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
    const cancelledCount = filteredOrders.filter(o => o.status === 'CANCELLED' || o.status === '취소' || o.stage === '취소').length;

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
                    <div className="flex flex-wrap align-items-center gap-4">
                        {/* 템플릿 유형 */}
                        <div className="flex align-items-center gap-2">
                            <span className="text-700 font-semibold text-sm whitespace-nowrap">
                                템플릿 유형 :
                            </span>
                            <Dropdown 
                                value={templateFilter} 
                                options={templateOptions} 
                                onChange={(e) => handleTemplateChange(e.value)} 
                                className="p-inputtext-sm w-12rem"
                                placeholder="템플릿 선택"
                            />
                        </div>

                        {/* 공정 상태 */}
                        <div className="flex align-items-center gap-2">
                            <span className="text-700 font-semibold text-sm whitespace-nowrap">
                                공정 상태 :
                            </span>
                            <Dropdown 
                                value={stageFilter} 
                                options={stageOptions} 
                                onChange={(e) => setStageFilter(e.value)} 
                                className="p-inputtext-sm w-11rem"
                                placeholder="공정상태 선택"
                            />
                        </div>

                        {/* 검색어 */}
                        <div className="flex align-items-center gap-2">
                            <span className="text-700 font-semibold text-sm whitespace-nowrap">
                                검색어 :
                            </span>
                            <div className="p-inputgroup w-15rem">
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
                <div className="flex align-items-center justify-content-between mb-2">
                    <span className="text-600 text-sm font-medium">
                        총 <strong className="text-900 font-bold">{totalCount}</strong>건의 주문
                        {cancelledCount > 0 && (
                            <span className="text-500 ml-2 font-normal">
                                (취소건 <strong className="text-red-500 font-bold">{cancelledCount}</strong>건 포함)
                            </span>
                        )}
                    </span>
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
