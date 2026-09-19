import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface CancelOrderModalProps {
    visible: boolean;
    onHide: () => void;
    cancelEstimate: number | null;
    submitCancelOrder: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
    visible, onHide, cancelEstimate, submitCancelOrder
}) => {
    return (
        <Dialog 
            header="주문 취소 및 위약금 확인" 
            visible={visible} 
            style={{ width: '500px', maxWidth: '90vw' }} 
            onHide={onHide}
            dismissableMask
        >
            <div className="flex flex-column align-items-center justify-content-center text-center p-3">
                <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2.5rem' }}></i>
                <h3 className="mt-3 mb-2 font-bold text-900">주문을 정말 취소하시겠습니까?</h3>
                <p className="m-0 mb-4 text-600 text-sm">
                    현재 공정 진행 상태에 따라 위약금이 부과됩니다.<br />
                    한 번 취소된 주문은 복구할 수 없습니다.
                </p>
                
                <div className="surface-100 p-3 border-round w-full border-1 border-200">
                    <div className="text-600 font-bold text-xs mb-1">예상 위약금 (취소 수수료)</div>
                    <div className="text-2xl font-bold text-red-600 font-mono">
                        ₩{cancelEstimate !== null && cancelEstimate !== undefined ? cancelEstimate.toLocaleString() : 0}
                    </div>
                </div>
            </div>
            
            <div className="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 surface-border">
                <Button 
                    label="돌아가기" 
                    icon="pi pi-times" 
                    onClick={onHide} 
                    className="p-button-text p-button-secondary" 
                />
                <Button 
                    label="주문 취소 확정" 
                    icon="pi pi-trash" 
                    onClick={submitCancelOrder} 
                    className="p-button-danger" 
                    autoFocus 
                />
            </div>
        </Dialog>
    );
};
