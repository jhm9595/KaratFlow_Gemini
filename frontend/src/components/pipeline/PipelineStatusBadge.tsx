import React from 'react';

interface PipelineStatusBadgeProps {
    rowData: any;
    pipelineSteps?: any[];
    pipelineStages?: string[];
}

export const PipelineStatusBadge: React.FC<PipelineStatusBadgeProps> = ({ rowData, pipelineSteps, pipelineStages }) => {
    if (!rowData) return null;

    if (rowData.isHold) {
        return (
            <span className="px-3 py-1 text-white font-bold border-round text-xs shadow-1 inline-block" style={{ backgroundColor: '#EF4444' }}>
                HOLD (보류)
            </span>
        );
    }
    
    let rawStage = rowData.stage || rowData.stageName || '접수';
    if (rawStage === 'PENDING') rawStage = '접수';
    else if (rawStage === 'CASTING') rawStage = '주물';
    else if (rawStage === 'POLISHING') rawStage = '세공';
    else if (rawStage === 'COMPLETED' || rawStage === 'DONE' || rowData.status === 'COMPLETED') {
        const lastStage = (pipelineStages && pipelineStages.length > 0) ? pipelineStages[pipelineStages.length - 1] : '완료';
        rawStage = (rowData.stage && rowData.stage !== 'COMPLETED' && rowData.stage !== 'DONE') ? rowData.stage : lastStage;
    }

    let matchedStep = (pipelineSteps && pipelineSteps.length > 0) ? pipelineSteps.find((step: any) => step.stageName === rawStage) : null;
    if (!matchedStep && pipelineSteps && pipelineSteps.length > 0) {
        matchedStep = pipelineSteps.find((step: any) => 
            step.stageName && step.stageName.trim().toLowerCase() === rawStage.trim().toLowerCase()
        );
    }
    if (!matchedStep && pipelineSteps && pipelineSteps.length > 0) {
        if (rawStage === 'COMPLETED' || rawStage === 'DONE' || rawStage === '완성') {
            matchedStep = pipelineSteps.find((step: any) => step.stageName === '완료' || step.stageName === 'COMPLETED');
        } else if (rawStage === 'PENDING') {
            matchedStep = pipelineSteps.find((step: any) => step.stageName === '접수' || step.stageName === 'PENDING');
        }
    }

    const bg = matchedStep ? (matchedStep.colorGradient || matchedStep.colorHex) : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';

    return (
        <span 
            className="px-3 py-1 text-white font-bold border-round text-xs shadow-1 inline-block"
            style={{ background: bg }}
        >
            {rawStage}
        </span>
    );
};
