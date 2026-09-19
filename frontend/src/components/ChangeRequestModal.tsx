import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface ChangeRequestModalProps {
    visible: boolean;
    onHide: () => void;
    submitChangeRequest: () => void;
}

export const ChangeRequestModal: React.FC<ChangeRequestModalProps> = ({
    visible, onHide, submitChangeRequest
}) => {
    return (
        <Dialog 
            header="주문 변경 / 보류 요청" 
            visible={visible} 
            style={{ width: '450px', maxWidth: '90vw' }} 
            onHide={onHide}
            dismissableMask
        >
            <div className="p-3">
                <p className="m-0 text-700 leading-normal">
                    해당 주문을 <strong>보류(HOLD) 상태</strong>로 변경하고 제조업체 및 카카오톡 알림으로 변경 요청 알림을 전송합니다.
                </p>
            </div>
            
            <div className="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 surface-border">
                <Button 
                    label="취소" 
                    icon="pi pi-times" 
                    onClick={onHide} 
                    className="p-button-text p-button-secondary" 
                />
                <Button 
                    label="요청 전송" 
                    icon="pi pi-check" 
                    onClick={submitChangeRequest} 
                    className="p-button-warning"
                    autoFocus 
                />
            </div>
        </Dialog>
    );
};
