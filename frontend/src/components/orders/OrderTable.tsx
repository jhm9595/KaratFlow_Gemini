import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { PipelineStatusBadge } from '../pipeline/PipelineStatusBadge';
import { formatImageUrl } from '../../utils/image';

interface OrderTableProps {
    orders: any[];
    selectedOrderId: number | null;
    onSelectOrder: (id: number) => void;
    onOpenOrderDetail: (id: number) => void;
    pipelineSteps?: any[];
    pipelineStages?: string[];
}

export const OrderTable: React.FC<OrderTableProps> = ({
    orders,
    selectedOrderId,
    onSelectOrder,
    onOpenOrderDetail,
    pipelineSteps,
    pipelineStages,
}) => {
    const [first, setFirst] = useState(0);

    return (
        <div className="flex-1 flex flex-column justify-content-between overflow-hidden h-full">
            <DataTable 
                value={orders} 
                size="small" 
                paginator 
                rows={10} 
                first={first}
                onPage={(e) => setFirst(e.first)}
                scrollable 
                scrollHeight="flex" 
                selectionMode="single" 
                selection={selectedOrderId === null ? null : orders.find(o => o.id === selectedOrderId)} 
                onSelectionChange={(e) => { 
                    if (e.value?.id) {
                        onSelectOrder(e.value.id); 
                        onOpenOrderDetail(e.value.id);
                    }
                }} 
                dataKey="id" 
                emptyMessage="등록된 주문이 없습니다." 
                className="p-datatable-sm cursor-pointer flex-1 flex flex-column justify-content-between h-full" 
                rowClassName={(row: any) => row.isHold ? 'hold-pulse-row' : 'surface-0 text-900 hover:surface-50 transition-colors transition-duration-200'}
            >
                <Column 
                    header="No." 
                    style={{ width: '50px', textAlign: 'center' }} 
                    body={(row: any, options: any) => {
                        const idx = orders.findIndex(o => o.id === row.id);
                        const displayIndex = idx !== -1 ? idx + 1 : (first + (options?.rowIndex ?? 0) + 1);
                        return (
                            <span className="text-500 font-semibold text-xs text-center block">
                                {displayIndex}
                            </span>
                        );
                    }} 
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
                    field="design" 
                    header="Design" 
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
                <Column field="customerName" header="고객명" />
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
                <Column 
                    header="" 
                    body={(rowData) => (
                        <Button 
                            icon="pi pi-eye" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onSelectOrder(rowData.id); 
                                onOpenOrderDetail(rowData.id); 
                            }} 
                            className="p-button-rounded p-button-text p-button-sm p-button-secondary" 
                            aria-label="상세보기" 
                            tooltip="상세보기" 
                            tooltipOptions={{ position: 'left' }} 
                        />
                    )} 
                    style={{ width: '60px' }} 
                />
            </DataTable>
        </div>
    );
};

export default OrderTable;
