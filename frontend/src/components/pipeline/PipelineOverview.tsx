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

    const getStageCount = (stage: string) => {
        return orders.filter(o => {
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
    };

    if (stepsToRender.length === 0) {
        return (
            <div className="surface-0 p-3 border-round shadow-1">
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
                <div className="flex flex-column align-items-center justify-content-center py-4 px-3 surface-50 border-round border-1 border-dashed border-300 text-center">
                    <div className="w-3rem h-3rem border-circle bg-amber-50 text-amber-600 flex align-items-center justify-content-center mb-2 shadow-1">
                        <i className="pi pi-sitemap text-xl font-bold"></i>
                    </div>
                    <h5 className="m-0 mb-1 text-800 font-bold text-base">등록된 공정 템플릿이 없습니다</h5>
                    <p className="text-500 text-sm m-0 mb-3" style={{ maxWidth: '440px', lineHeight: '1.5' }}>
                        사업장에 맞는 공정 단계를 등록하시면 주문 제작 과정의 실시간 공정 파이프라인이 활성화됩니다.
                    </p>
                    <Button 
                        label="공정 템플릿 등록하기" 
                        icon="pi pi-plus" 
                        className="p-button-primary p-button-sm font-bold shadow-1" 
                        onClick={() => openModal('processManager')} 
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="surface-0 p-3 border-round shadow-1">
            {/* Header: Title, Template Dropdown & Process Manager Cog Button */}
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

            {/* Pipeline Stages: Arrow Flow Connectors (안 2) */}
            <div className="w-full flex justify-content-center align-items-center py-2 overflow-x-auto">
                <div className="flex align-items-center gap-4">
                    {stepsToRender.map((stepObj: any, idx: number) => {
                        const stage = stepObj.stageName || stepObj.stageCode;
                        const count = getStageCount(stage);
                        const bg = stepObj.colorGradient || stepObj.colorHex || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                        const isLast = idx === stepsToRender.length - 1;

                        return (
                            <React.Fragment key={stage}>
                                <div className="flex flex-column align-items-center">
                                    <div 
                                        className="flex align-items-center justify-content-center border-circle mb-2 transition-transform transform hover:scale-105" 
                                        style={{ 
                                            width: '58px', 
                                            height: '58px', 
                                            background: bg,
                                            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                                            border: '2.5px solid #ffffff'
                                        }}
                                    >
                                        <span className="text-xl font-bold text-white drop-shadow">{count}</span>
                                    </div>
                                    <span 
                                        className="text-800 font-bold text-xs px-2.5 py-0.5 border-round shadow-1 bg-white" 
                                        style={{ color: stepObj.colorHex || '#333' }}
                                    >
                                        {stage}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div className="flex align-items-center justify-content-center px-1 mb-3 text-400">
                                        <i className="pi pi-chevron-right font-bold text-xl text-primary" style={{ opacity: 0.75 }} />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PipelineOverview;
