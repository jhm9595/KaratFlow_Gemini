import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

interface SubcontractModalProps {
    visible: boolean;
    onHide: () => void;
    subcontracts: any[];
    scForm: any;
    setScForm: React.Dispatch<React.SetStateAction<any>>;
    receiveForm: { [key: number]: number };
    setReceiveForm: React.Dispatch<React.SetStateAction<{ [key: number]: number }>>;
    handleDispatchSubcontract: () => void;
    handleReceiveSubcontract: (taskId: number) => void;
}

export const SubcontractModal: React.FC<SubcontractModalProps> = ({
    visible, onHide, subcontracts, scForm, setScForm, receiveForm, setReceiveForm,
    handleDispatchSubcontract, handleReceiveSubcontract
}) => {
    return (
        <Dialog 
            header="외주 공정 관리 및 금 감모 추적" 
            visible={visible} 
            style={{ width: '65vw', maxWidth: '1000px' }} 
            onHide={onHide}
            dismissableMask
        >
            <div className="flex flex-column gap-4 pt-2">
                <div className="surface-100 p-4 border-round border-1 border-200">
                    <h3 className="m-0 mb-3 text-base font-bold text-900 flex align-items-center gap-2">
                        <i className="pi pi-upload text-primary"></i> 신규 외주 반출 기록
                    </h3>
                    <div className="grid">
                        <div className="col-12 md:col-3">
                            <label className="font-bold text-sm">작업명 (예: 도금)</label>
                            <InputText 
                                className="w-full mt-1" 
                                value={scForm.taskName} 
                                onChange={(e) => setScForm({ ...scForm, taskName: e.target.value })} 
                            />
                        </div>
                        <div className="col-12 md:col-3 flex flex-column gap-1">
                            <label className="font-bold text-sm">외주업체명</label>
                            <InputText 
                                className="w-full mt-1" 
                                value={scForm.subcontractorName} 
                                onChange={(e) => setScForm({ ...scForm, subcontractorName: e.target.value })} 
                            />
                        </div>
                        <div className="col-12 md:col-3 flex flex-column gap-1">
                            <label className="font-bold text-sm">반출 실측 중량 (g)</label>
                            <InputNumber 
                                className="w-full mt-1" 
                                value={scForm.dispatchedWeightG} 
                                onValueChange={(e) => setScForm({ ...scForm, dispatchedWeightG: e.value || 0 })} 
                                mode="decimal" 
                                minFractionDigits={2} 
                            />
                        </div>
                        <div className="col-12 md:col-3 flex flex-column gap-1">
                            <label className="font-bold text-sm">합의 외주공임 (원)</label>
                            <InputNumber 
                                className="w-full mt-1" 
                                value={scForm.agreedLaborFee} 
                                onValueChange={(e) => setScForm({ ...scForm, agreedLaborFee: e.value || 0 })} 
                            />
                        </div>
                    </div>
                    <Button 
                        label="반출 등록 (Dispatch)" 
                        icon="pi pi-upload" 
                        onClick={handleDispatchSubcontract} 
                        className="mt-3 p-button-success p-button-sm" 
                    />
                </div>

                <div>
                    <h3 className="m-0 mb-3 text-base font-bold text-900 flex align-items-center gap-2">
                        <i className="pi pi-list text-blue-500"></i> 외주 내역 및 감모율
                    </h3>
                    <DataTable value={subcontracts} responsiveLayout="scroll" size="small" stripedRows>
                        <Column field="taskName" header="작업명"></Column>
                        <Column field="subcontractorName" header="외주업체"></Column>
                        <Column 
                            field="status" 
                            header="상태" 
                            body={(r) => {
                                const isReceived = r.status === 'RECEIVED';
                                return <Tag severity={isReceived ? 'success' : 'warning'} value={isReceived ? '반입완료' : '반출됨'} rounded></Tag>;
                            }} 
                        />
                        <Column field="dispatchedWeightG" header="반출(g)"></Column>
                        <Column 
                            header="반입(g)" 
                            body={(r) => {
                                if (r.status === 'RECEIVED') return <span>{r.receivedWeightG}g</span>;
                                return (
                                    <div className="flex gap-2 align-items-center">
                                        <InputNumber 
                                            value={receiveForm[r.id]} 
                                            onValueChange={(e) => setReceiveForm({ ...receiveForm, [r.id]: e.value || 0 })} 
                                            className="w-5rem" 
                                            mode="decimal" 
                                            minFractionDigits={2} 
                                        />
                                        <Button icon="pi pi-download" onClick={() => handleReceiveSubcontract(r.id)} className="p-button-sm" tooltip="반입 확인" />
                                    </div>
                                );
                            }} 
                        />
                        <Column 
                            header="감모량(g)" 
                            body={(r) => {
                                if (r.lossWeightG === null || r.lossWeightG === undefined) return '-';
                                const percent = ((r.lossWeightG / r.dispatchedWeightG) * 100).toFixed(1);
                                return <span className={r.lossWeightG > 0 ? "text-red-500 font-bold" : ""}>{r.lossWeightG.toFixed(2)}g ({percent}%)</span>;
                            }} 
                        />
                        <Column field="agreedLaborFee" header="공임비(원)" body={(r) => <span>₩{r.agreedLaborFee?.toLocaleString()}</span>}></Column>
                    </DataTable>
                </div>
            </div>
        </Dialog>
    );
};
