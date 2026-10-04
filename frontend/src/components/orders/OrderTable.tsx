import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Image } from 'primereact/image';
import { Button } from 'primereact/button';
import { PipelineStatusBadge } from '../pipeline/PipelineStatusBadge';

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
        <DataTable 
            value={orders} 
            size="small" 
            paginator 
            rows={10} 
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
            className="p-datatable-sm cursor-pointer" 
            rowClassName={(row: any) => row.isHold ? 'hold-pulse-row' : 'surface-0 text-900 hover:surface-50 transition-colors transition-duration-200'}
        >
            <Column header="" style={{ width: '52px' }} body={(row: any) => row.imageUrl ? (
                <Image src={`http://localhost:8888${row.imageUrl}`} alt="" width="36" height="36" preview style={{ objectFit: 'cover', borderRadius: '6px' }} />
            ) : <span className="pi pi-image text-300" />} />
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
    );
};

export default OrderTable;
