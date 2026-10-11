import React from 'react';
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
    return (
        <div className="flex-1 flex flex-column justify-content-between overflow-hidden h-full">
            <DataTable 
                value={orders} 
                size="small" 
                paginator 
                rows={15} 
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
                <Column header="주문 번호" body={(r) => <span className="font-bold text-primary">#{r.orderNo || r.id}</span>} style={{ minWidth: '120px' }} />
                <Column header="수량" style={{ width: '72px' }} body={(row: any) => <span className="font-bold text-700">{row.quantity ?? 1}건</span>} />
                <Column field="design" header="Design" />
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
