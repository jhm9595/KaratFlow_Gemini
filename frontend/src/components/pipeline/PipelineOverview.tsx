import React, { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';

interface PipelineOverviewProps {
    orders: any[];
    pipelineSteps: any[];
    templates?: any[];
}

export const PipelineOverview: React.FC<PipelineOverviewProps> = ({ orders, pipelineSteps, templates }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

    const activeTemplate = templates && templates.length > 0
        ? (selectedTemplateId ? templates.find(t => t.id === selectedTemplateId) || templates[0] : (templates.find(t => t.isDefault) || templates[0]))
        : null;

    const stepsToRender = activeTemplate?.steps && activeTemplate.steps.length > 0
        ? activeTemplate.steps
        : pipelineSteps;

    return (
        <div className="surface-0 p-3 border-round shadow-1">
            <div className="flex justify-content-between align-items-center mb-3">
                <h4 className="m-0 text-600 font-medium flex align-items-center gap-2">
                    <i className="pi pi-sitemap text-primary"></i> 실시간 공정 현황 (Pipeline)
                </h4>
                {templates && templates.length > 1 && (
                    <div className="flex align-items-center gap-2" style={{ minWidth: '220px' }}>
                        <span className="text-xs text-500 font-bold white-space-nowrap">템플릿 필터:</span>
                        <Dropdown 
                            value={activeTemplate?.id} 
                            options={templates.map(t => ({ label: `${t.templateName}${t.isDefault ? ' (기본)' : ''}`, value: t.id }))} 
                            onChange={(e) => setSelectedTemplateId(e.value)} 
                            className="p-inputtext-sm font-bold text-xs" 
                            style={{ height: '32px' }} 
                        />
                    </div>
                )}
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

                        let s = o.stage || '접수';
                        if (s === 'PENDING') s = '접수';
                        else if (s === 'CASTING') s = '주물';
                        else if (s === 'POLISHING') s = '세공';
                        
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
