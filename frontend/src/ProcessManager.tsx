import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { API_BASE_URL } from './config/apiConfig';

interface ProcessManagerProps {
    visible: boolean;
    onHide: () => void;
}

interface StageItem {
    stageName: string;
    colorHex: string;
    colorGradient: string;
}

const COLOR_PRESETS = [
    { name: '파스텔 스카이블루', hex: '#38BDF8', gradient: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)' },
    { name: '파스텔 라벤더', hex: '#C084FC', gradient: 'linear-gradient(135deg, #e879f9 0%, #c084fc 100%)' },
    { name: '파스텔 웜피치', hex: '#FB923C', gradient: 'linear-gradient(135deg, #fde047 0%, #fb923c 100%)' },
    { name: '파스텔 소프트로즈', hex: '#F472B6', gradient: 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)' },
    { name: '파스텔 민트그린', hex: '#34D399', gradient: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)' },
    { name: '파스텔 레몬옐로우', hex: '#FACC15', gradient: 'linear-gradient(135deg, #fef08a 0%, #facc15 100%)' },
    { name: '파스텔 페리윙클', hex: '#818CF8', gradient: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)' },
    { name: '파스텔 아쿠아', hex: '#2DD4BF', gradient: 'linear-gradient(135deg, #99f6e4 0%, #2dd4bf 100%)' },
];

export const ProcessManager: React.FC<ProcessManagerProps> = ({ visible, onHide }) => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Create/Edit Modal State
    const [formVisible, setFormVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formStages, setFormStages] = useState<StageItem[]>([]);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    
    const toast = React.useRef<Toast>(null);
    const apiUrl = API_BASE_URL;

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
        setFormStages([
            { stageName: '', colorHex: COLOR_PRESETS[0].hex, colorGradient: COLOR_PRESETS[0].gradient }
        ]);
        setFormVisible(true);
    };

    const openEdit = (rowData: any) => {
        setIsEdit(true);
        setCurrentId(rowData.id);
        setFormName(rowData.templateName);
        setFormDesc(rowData.description || '');
        if (Array.isArray(rowData.steps) && rowData.steps.length > 0) {
            setFormStages(rowData.steps.map((s: any, idx: number) => {
                const preset = COLOR_PRESETS[idx % COLOR_PRESETS.length];
                return {
                    stageName: s.stageName,
                    colorHex: s.colorHex || preset.hex,
                    colorGradient: s.colorGradient || preset.gradient
                };
            }));
        } else {
            setFormStages([]);
        }
        setFormVisible(true);
    };

    const saveTemplate = () => {
        if (!formName.trim() || formStages.length === 0) {
            toast.current?.show({ severity: 'warn', summary: '입력 오류', detail: '템플릿 이름과 최소 1개 이상의 공정 단계를 입력해 주세요.' });
            return;
        }

        const stageNames = formStages.map(s => s.stageName.trim());
        if (stageNames.some(name => !name)) {
            toast.current?.show({ severity: 'warn', summary: '입력 오류', detail: '공정 단계 이름은 비워둘 수 없습니다.' });
            return;
        }

        const hasDuplicate = new Set(stageNames).size !== stageNames.length;
        if (hasDuplicate) {
            toast.current?.show({ severity: 'warn', summary: '중복 오류', detail: '동일한 공정 단계 이름이 중복되어 있습니다.' });
            return;
        }

        const payload = {
            templateName: formName,
            description: formDesc,
            templateCode: isEdit ? undefined : ("TPL_" + new Date().getTime()),
            steps: formStages.map((s, idx) => ({
                stageName: s.stageName.trim(),
                stepOrder: idx + 1,
                colorHex: s.colorHex,
                colorGradient: s.colorGradient
            }))
        };

        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${apiUrl}/api/process-templates/${currentId}` : `${apiUrl}/api/process-templates`;

        fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        }).then(async res => {
            if (res.ok) {
                toast.current?.show({ severity: 'success', summary: '성공', detail: '템플릿이 저장되었습니다.' });
                setFormVisible(false);
                loadTemplates();
                window.location.reload();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.current?.show({ 
                    severity: 'error', 
                    summary: '저장 실패', 
                    detail: err.message || '템플릿 저장에 실패했습니다.',
                    life: 4000
                });
            }
        });
    };

    const deleteTemplate = (id: number) => {
        if (!window.confirm('정말로 이 공정 템플릿을 삭제하시겠습니까?')) return;
        
        fetch(`${apiUrl}/api/process-templates/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }).then(async res => {
            if (res.ok) {
                toast.current?.show({ severity: 'info', summary: '삭제 완료', detail: '템플릿이 삭제되었습니다.' });
                loadTemplates();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.current?.show({ 
                    severity: 'error', 
                    summary: '삭제 불가', 
                    detail: err.message || '현재 진행 중인 작업이 연결되어 있는 공정 템플릿은 삭제할 수 없습니다.',
                    life: 5000
                });
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
        if (rowData.steps && Array.isArray(rowData.steps)) {
            return (
                <div className="flex flex-wrap gap-1 align-items-center">
                    {rowData.steps.map((step: any, idx: number) => {
                        const bg = step.colorGradient || step.colorHex || COLOR_PRESETS[idx % COLOR_PRESETS.length].gradient;
                        return (
                            <React.Fragment key={idx}>
                                {idx > 0 && <span className="text-400 font-bold px-1">➔</span>}
                                <span 
                                    className="px-2 py-1 text-white font-bold border-round text-xs shadow-1"
                                    style={{ background: bg }}
                                >
                                    {step.stageName}
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>
            );
        }
        return rowData.stagesJson || '-';
    };

    return (
        <Dialog 
            header={header} 
            visible={visible} 
            style={{ width: '960px', maxWidth: '95vw', minWidth: '760px' }} 
            breakpoints={{ '960px': '85vw', '641px': '95vw' }}
            onHide={onHide}
        >
            <Toast ref={toast} />
            <div className="p-fluid">
                <div className="flex justify-content-between mb-3 align-items-center">
                    <p className="m-0 text-600">공장마다 다른 공정 단계 및 유니크 그라데이션 색상을 커스터마이징 할 수 있습니다.</p>
                    <Button label="새 템플릿 추가" icon="pi pi-plus" className="p-button-sm p-button-success" style={{width: 'auto'}} onClick={openCreate} />
                </div>
                
                <DataTable value={templates} loading={loading} emptyMessage="저장된 공정 템플릿이 없습니다.">
                    <Column field="templateName" header="템플릿 이름" style={{ width: '22%' }}></Column>
                    <Column field="description" header="설명" style={{ width: '22%' }}></Column>
                    <Column body={stagesTemplate} header="공정 단계 및 고유 색상"></Column>
                    <Column body={(rowData) => (
                        <div className="flex gap-2">
                            {rowData.isDefault ? (
                                <Button label="기본 공정" className="p-button-sm p-button-success p-button-outlined" disabled />
                            ) : (
                                <Button label="기본 설정" className="p-button-sm p-button-secondary p-button-outlined" onClick={() => setDefaultTemplate(rowData.id)} />
                            )}
                            <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-info" onClick={() => openEdit(rowData)} tooltip="공정명 및 색상 커스텀" />
                            <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger" onClick={() => deleteTemplate(rowData.id)} />
                        </div>
                    )} style={{ width: '25%' }}></Column>
                </DataTable>
            </div>

            <Dialog 
                header={isEdit ? "공정 템플릿 & 색상 커스터마이징" : "새 공정 템플릿 추가"} 
                visible={formVisible} 
                style={{ width: '620px', maxWidth: '95vw', minWidth: '480px' }} 
                breakpoints={{ '641px': '95vw' }}
                onHide={() => setFormVisible(false)}
            >
                <div className="p-fluid mt-2">
                    <div className="field mb-3">
                        <label className="font-bold">템플릿 이름</label>
                        <InputText value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="예: 우리공방 공정, 맞춤 제작 공정" />
                    </div>
                    <div className="field mb-3">
                        <label className="font-bold">간단한 설명</label>
                        <InputText value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="예: 작업장 특성에 맞춘 공정 순서" />
                    </div>
                    <div className="field mb-3">
                        <label className="font-bold mb-2 block">공정 단계 및 유니크 색상 커스텀</label>
                        <div className="text-xs text-500 mb-2">각 공정의 색상을 직접 선택하거나 추천 컬러 팔레트에서 원클릭으로 지정하세요.</div>
                        
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
                                className="flex align-items-center mb-2 gap-2 p-2 border-round surface-0 shadow-1"
                            >
                                <i className="pi pi-bars text-400 cursor-move" title="드래그해서 순서 변경" style={{ fontSize: '1.1rem' }} />
                                <span className="text-500 font-bold text-right" style={{ width: '18px' }}>{idx + 1}.</span>
                                
                                {/* Color Preview Indicator (Read-only) */}
                                <div 
                                    className="w-2rem h-2rem border-circle border-2 border-white shadow-1 flex-shrink-0"
                                    style={{ background: stage.colorGradient || stage.colorHex }}
                                    title={`현재 색상: ${stage.colorHex}`}
                                />

                                <InputText 
                                    value={stage.stageName} 
                                    onChange={(e) => {
                                        const updated = [...formStages];
                                        updated[idx].stageName = e.target.value;
                                        setFormStages(updated);
                                    }} 
                                    placeholder="공정 단계명 입력" 
                                    className="flex-1 p-inputtext-sm font-bold"
                                />

                                {/* Complete Color Customization (Native Color Picker) */}
                                <label 
                                    className="p-button p-component p-button-rounded p-button-text p-button-secondary p-0 flex align-items-center justify-content-center cursor-pointer transition-colors hover:surface-200 flex-shrink-0"
                                    style={{ width: '2rem', height: '2rem' }}
                                    title="색상 직접 커스터마이징 (클릭하여 자유롭게 색상 선택)"
                                >
                                    <i className="pi pi-palette text-600" style={{ fontSize: '1.1rem' }}></i>
                                    <input 
                                        type="color" 
                                        value={stage.colorHex} 
                                        onChange={(e) => {
                                            const hex = e.target.value;
                                            const updated = [...formStages];
                                            updated[idx] = {
                                                ...updated[idx],
                                                colorHex: hex,
                                                colorGradient: `linear-gradient(135deg, ${hex} 0%, #1e293b 100%)`
                                            };
                                            setFormStages(updated);
                                        }}
                                        className="opacity-0 w-0 h-0 p-0 m-0 border-none absolute"
                                    />
                                </label>

                                <Button 
                                    type="button"
                                    icon="pi pi-times" 
                                    className="p-button-rounded p-button-danger p-button-text p-0 flex-shrink-0" 
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
                            onClick={() => {
                                const nextPreset = COLOR_PRESETS[formStages.length % COLOR_PRESETS.length];
                                setFormStages([
                                    ...formStages, 
                                    { stageName: '', colorHex: nextPreset.hex, colorGradient: nextPreset.gradient }
                                ]);
                            }} 
                        />
                    </div>
                    <div className="flex justify-content-end mt-4">
                        <Button label="취소" icon="pi pi-times" onClick={() => setFormVisible(false)} className="p-button-text" style={{width: 'auto', marginRight: '8px'}} />
                        <Button label="저장 및 적용" icon="pi pi-check" onClick={saveTemplate} className="p-button-primary" style={{width: 'auto'}} autoFocus />
                    </div>
                </div>
            </Dialog>
        </Dialog>
    );
};
