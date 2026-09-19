import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';


interface ProcessManagerProps {
    visible: boolean;
    onHide: () => void;
}

export const ProcessManager: React.FC<ProcessManagerProps> = ({ visible, onHide }) => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Create/Edit Modal State
    const [formVisible, setFormVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formStages, setFormStages] = useState<string[]>([]);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    
    const toast = React.useRef<Toast>(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8888';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('jwtToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };


    const setDefaultTemplate = (id: number) => {
        fetch(`${apiUrl}/api/process-templates/${id}/set-default`, {
            method: 'PUT',
            headers: getAuthHeaders()
        })
        .then(res => {
            if (res.ok) {
                toast.current?.show({ severity: 'success', summary: '성공', detail: '기본 공정으로 설정되었습니다.' });
                loadTemplates();
                // Optionally reload window to update the App.tsx dashboard
                window.location.reload();
            } else {
                throw new Error('Failed to set default');
            }
        })
        .catch(err => {
            console.error(err);
            toast.current?.show({ severity: 'error', summary: '오류', detail: '기본 공정 설정에 실패했습니다.' });
        });
    };

    const loadTemplates = () => {
        setLoading(true);
        fetch(`${apiUrl}/api/process-templates`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setTemplates(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load templates", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (visible) {
            loadTemplates();
        }
    }, [visible]);

    const openCreate = () => {
        setIsEdit(false);
        setCurrentId(null);
        setFormName('');
        setFormDesc('');
        setFormStages(['접수', '진행중', '완료']);
        setFormVisible(true);
    };

    const openEdit = (rowData: any) => {
        setIsEdit(true);
        setCurrentId(rowData.id);
        setFormName(rowData.templateName);
        setFormDesc(rowData.description || '');
        try {
            setFormStages(rowData.steps.map((s: any) => s.stageName));
        } catch {
            setFormStages([]);
        }
        setFormVisible(true);
    };

    const saveTemplate = () => {
        if (!formName.trim() || formStages.length === 0) {
            toast.current?.show({ severity: 'warn', summary: '입력 오류', detail: '이름과 공정 단계를 입력하세요.' });
            return;
        }

        const payload = {
            templateName: formName,
            description: formDesc,
            templateCode: "TEMPLATE_" + new Date().getTime(),
            steps: formStages.map((s, idx) => ({
                stageName: s,
                stepOrder: idx + 1
            }))
        };

        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${apiUrl}/api/process-templates/${currentId}` : `${apiUrl}/api/process-templates`;

        fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        }).then(res => {
            if (res.ok) {
                toast.current?.show({ severity: 'success', summary: '성공', detail: '템플릿이 저장되었습니다.' });
                setFormVisible(false);
                loadTemplates();
            } else {
                toast.current?.show({ severity: 'error', summary: '오류', detail: '저장에 실패했습니다.' });
            }
        });
    };

    const deleteTemplate = (id: number) => {
        if (!window.confirm('정말로 이 템플릿을 삭제하시겠습니까?')) return;
        
        fetch(`${apiUrl}/api/process-templates/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }).then(res => {
            if (res.ok) {
                toast.current?.show({ severity: 'success', summary: '삭제 완료', detail: '템플릿이 삭제되었습니다.' });
                loadTemplates();
            }
        });
    };

    const header = (
        <div className="flex justify-content-between align-items-center">
            <span>공장 맞춤형 공정 템플릿 관리</span>
            <Button icon="pi pi-refresh" className="p-button-text p-button-sm" onClick={loadTemplates} />
        </div>
    );

    const stagesTemplate = (rowData: any) => {
        try {
            const stages = JSON.parse(rowData.stagesJson);
            return stages.join(' ➔ ');
        } catch {
            return rowData.stagesJson;
        }
    };

    return (
        <Dialog header={header} visible={visible} style={{ width: '60vw' }} onHide={onHide}>
            <Toast ref={toast} />
            <div className="p-fluid">
                <div className="flex justify-content-between mb-3 align-items-center">
                    <p className="m-0 text-600">공장마다 다른 공정 단계를 템플릿으로 정의할 수 있습니다. 엔터를 치면 단계가 추가됩니다.</p>
                    <Button label="새 템플릿 추가" icon="pi pi-plus" className="p-button-sm p-button-success" style={{width: 'auto'}} onClick={openCreate} />
                </div>
                
                <DataTable value={templates} loading={loading} emptyMessage="저장된 공정 템플릿이 없습니다.">
                    <Column field="templateName" header="템플릿 이름" style={{ width: '25%' }}></Column>
                    <Column field="description" header="설명" style={{ width: '25%' }}></Column>
                    <Column body={stagesTemplate} header="공정 단계"></Column>
                    <Column body={(rowData) => (
                        <div className="flex gap-2">
                            {rowData.isDefault ? (
                                <Button label="기본 공정" className="p-button-sm p-button-success p-button-outlined" disabled />
                            ) : (
                                <Button label="기본 설정" className="p-button-sm p-button-secondary p-button-outlined" onClick={() => setDefaultTemplate(rowData.id)} />
                            )}
                            <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-info" onClick={() => openEdit(rowData)} />
                            <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger" onClick={() => deleteTemplate(rowData.id)} />
                        </div>
                    )} style={{ width: '25%' }}></Column>
                </DataTable>
            </div>

            <Dialog header={isEdit ? "템플릿 수정" : "새 템플릿 추가"} visible={formVisible} style={{ width: '400px' }} onHide={() => setFormVisible(false)}>
                <div className="p-fluid mt-3">
                    <div className="field">
                        <label>템플릿 이름</label>
                        <InputText value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="예: 상세 5단계 공정" />
                    </div>
                    <div className="field">
                        <label>간단한 설명</label>
                        <InputText value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="예: A공장 전용 세부 공정" />
                    </div>
                    <div className="field">
                        <label className="font-medium mb-2 block">공정 단계 (순서대로 입력)</label>
                        {formStages.map((stage, idx) => (
                            <div 
                                key={idx} 
                                draggable
                                onDragStart={(e) => { 
                                    setDraggedIdx(idx); 
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.currentTarget.style.opacity = '0.5';
                                }}
                                onDragEnd={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                    setDraggedIdx(null);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (draggedIdx === null || draggedIdx === idx) return;
                                    const newStages = [...formStages];
                                    const item = newStages.splice(draggedIdx, 1)[0];
                                    newStages.splice(idx, 0, item);
                                    setFormStages(newStages);
                                    setDraggedIdx(null);
                                }}
                                className="flex align-items-center mb-2 gap-2 p-2 border-round surface-0 shadow-1 transition-colors hover:surface-50"
                            >
                                <i className="pi pi-bars text-400 cursor-move" title="드래그해서 순서 변경" style={{ fontSize: '1.2rem' }} />
                                <span className="text-500 font-bold text-right" style={{ width: '20px' }}>{idx + 1}.</span>
                                <InputText 
                                    value={stage} 
                                    onChange={(e) => {
                                        const newStages = [...formStages];
                                        newStages[idx] = e.target.value;
                                        setFormStages(newStages);
                                    }} 
                                    placeholder="공정명 입력 (예: 접수)" 
                                    className="flex-1"
                                />
                                <Button 
                                    icon="pi pi-times" 
                                    className="p-button-rounded p-button-danger p-button-text p-0" 
                                    style={{ width: '2rem', height: '2rem' }}
                                    onClick={() => {
                                        const newStages = formStages.filter((_, i) => i !== idx);
                                        setFormStages(newStages);
                                    }} 
                                    tooltip="삭제"
                                    tooltipOptions={{ position: 'top' }}
                                />
                            </div>
                        ))}
                        <Button 
                            type="button" 
                            label="새 공정 단계 추가" 
                            icon="pi pi-plus" 
                            className="p-button-outlined p-button-sm mt-2 w-full border-dashed" 
                            onClick={() => setFormStages([...formStages, ''])} 
                        />
                    </div>
                    <div className="flex justify-content-end mt-4">
                        <Button label="취소" icon="pi pi-times" onClick={() => setFormVisible(false)} className="p-button-text" style={{width: 'auto', marginRight: '8px'}} />
                        <Button label="저장" icon="pi pi-check" onClick={saveTemplate} className="p-button-primary" style={{width: 'auto'}} autoFocus />
                    </div>
                </div>
            </Dialog>
        </Dialog>
    );
};
