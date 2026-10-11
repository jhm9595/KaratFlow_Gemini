import React, { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useModal } from '../../hooks/useModal';

interface PipelineOverviewProps {
    orders: any[];
    pipelineSteps: any[];
    templates?: any[];
}

export const PipelineOverview: React.FC<PipelineOverviewProps> = ({ orders, pipelineSteps, templates }) => {
    const { openModal } = useModal();
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

    const validTemplates = (templates || []).filter(t => t && t.templateName && t.templateName.trim() !== '');

    const activeTemplate = validTemplates.length > 0
        ? (selectedTemplateId ? validTemplates.find(t => t.id === selectedTemplateId) || validTemplates[0] : (validTemplates.find(t => t.isDefault) || validTemplates[0]))
        : null;

    const stepsToRender: any[] = activeTemplate?.steps && activeTemplate.steps.length > 0
        ? activeTemplate.steps
        : (pipelineSteps && pipelineSteps.length > 0 ? pipelineSteps : []);

    if (stepsToRender.length === 0) {
        return (
            <div className="surface-0 p-4 border-round shadow-1">
                <div className="flex justify-content-between align-items-center mb-3">
                    <h4 className="m-0 text-600 font-medium flex align-items-center gap-2">
                        <i className="pi pi-sitemap text-primary"></i> 실시간 공정 현황 (Pipeline)
                    </h4>
                    <Button 
                        icon="pi pi-cog" 
                        className="p-button-rounded p-button-text p-button-secondary p-button-sm" 
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => openModal('processManager')} 
                        tooltip="공정 템플릿 관리" 
                        tooltipOptions={{ position: 'bottom' }} 
                    />
                </div>
                <div className="flex flex-column align-items-center justify-content-center py-4 surface-50 border-round border-1 border-dashed border-300">
                    <i className="pi pi-sitemap text-400 text-4xl mb-2"></i>
                    <h5 className="m-0 mb-1 text-700 font-bold">등록된 공정 템플릿 단계가 없습니다</h5>
                    <p className="text-500 text-sm m-0">우측 상단의 공정 관리(설정 아이콘)에서 템플릿을 등록하면 사업장 고유의 실시간 공정 파이프라인이 표시됩니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="surface-0 p-3 border-round shadow-1">
            <div className="flex justify-content-between align-items-center mb-3">
                <h4 className="m-0 text-600 font-medium flex align-items-center gap-2">
                    <i className="pi pi-sitemap text-primary"></i> 실시간 공정 현황 (Pipeline)
                </h4>
                <div className="flex align-items-center gap-2">
                    {validTemplates.length > 0 && (
                        <div className="flex align-items-center gap-2" style={{ minWidth: '220px' }}>
                            <span className="text-xs text-500 font-bold white-space-nowrap">템플릿:</span>
                            <Dropdown 
                                value={activeTemplate?.id} 
                                options={validTemplates.map(t => ({ label: `${t.templateName}${t.isDefault ? ' (기본)' : ''}`, value: t.id }))} 
                                onChange={(e) => setSelectedTemplateId(e.value)} 
                                className="p-inputtext-sm font-bold text-xs pipeline-template-dropdown" 
                                style={{ height: '32px' }} 
                            />
                        </div>
                    )}
                    <Button 
                        icon="pi pi-cog" 
                        className="p-button-rounded p-button-text p-button-secondary p-button-sm" 
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => openModal('processManager')} 
                        tooltip="공정 템플릿 관리" 
                        tooltipOptions={{ position: 'bottom' }} 
                    />
                </div>
            </div>

            <div className="flex justify-content-between align-items-center px-4 relative">
                {/* Connecting Line */}
                <div className="absolute w-full z-0" style={{ height: '4px', backgroundColor: '#e5e7eb', top: '30px', left: '0' }}></div>
                
                {stepsToRender.map((stepObj: any) => {
                    const stage = stepObj.stageName || stepObj.stageCode;
                    const count = orders.filter(o => {
                        // Match if order uses this template (or no template set), and is at this stage
                        if (activeTemplate && o.templateId && o.templateId !== activeTemplate.id) {
                            return false;
                        }

                        const s = o.stage || '';
                        const isDone = (st: string) => st === '완성' || st === '완료' || st === 'COMPLETED' || st === 'DONE';
                        if ((isDone(s) || o.status === 'COMPLETED') && isDone(stage)) {
                            return true;
                        }
                        return s === stage;
                    }).length;

                    const bg = stepObj.colorGradient || stepObj.colorHex || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';

                    return (
                        <div key={stage} className="flex flex-column align-items-center z-1 relative bg-white" style={{ borderRadius: '50%' }}>
                            <div 
                                className="flex align-items-center justify-content-center border-circle mb-2 transition-transform transform hover:scale-110" 
                                style={{ 
                                    width: '60px', 
                                    height: '60px', 
                                    background: bg,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                                    border: '2px solid #ffffff'
                                }}
                            >
                                <span className="text-2xl font-bold text-white drop-shadow">{count}</span>
                            </div>
                            <span className="text-800 font-bold bg-white px-2 border-round text-xs shadow-1" style={{ color: stepObj.colorHex || '#333' }}>{stage}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PipelineOverview;
