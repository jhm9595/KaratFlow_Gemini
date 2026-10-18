import React from 'react';
import { isOrderCancelled, isOrderCompleted } from '../../utils/orderStatus';

interface PipelineStatusBadgeProps {
    rowData: any;
    pipelineSteps?: any[];
    pipelineStages?: string[];
}

export const PipelineStatusBadge: React.FC<PipelineStatusBadgeProps> = ({ rowData, pipelineSteps, pipelineStages }) => {
    if (!rowData) return null;

    if (isOrderCancelled(rowData)) {
        return (
            <span 
                className="px-3 py-1 text-white font-bold border-round text-xs shadow-1 inline-block" 
                style={{ backgroundColor: '#64748B' }}
            >
                취소
            </span>
        );
    }

    if (rowData.isHold) {
        return (
            <span className="px-3 py-1 text-white font-bold border-round text-xs shadow-1 inline-block" style={{ backgroundColor: '#EF4444' }}>
                HOLD (보류)
            </span>
        );
    }
    
    const stepsToUse = (rowData.templateSteps && rowData.templateSteps.length > 0)
        ? rowData.templateSteps
        : (pipelineSteps && pipelineSteps.length > 0 ? pipelineSteps : []);

    let rawStage = rowData.stage || rowData.stageName;
    if (!rawStage && stepsToUse.length > 0) {
        rawStage = stepsToUse[0].stageName || stepsToUse[0].stageCode;
    }
    if (!rawStage) rawStage = '대기';

    const lastStepName = stepsToUse.length > 0 ? stepsToUse[stepsToUse.length - 1].stageName : undefined;
    const isCompleted = isOrderCompleted(rowData, lastStepName);

    if (isCompleted && stepsToUse.length > 0) {
        const lastStage = stepsToUse[stepsToUse.length - 1].stageName || '완료';
        rawStage = (rawStage && rawStage !== 'COMPLETED' && rawStage !== 'DONE' && rawStage !== '완료') ? rawStage : lastStage;
    }

    let matchedStep = stepsToUse.find((step: any) => step.stageName === rawStage);
    if (!matchedStep && stepsToUse.length > 0) {
        matchedStep = stepsToUse.find((step: any) => 
            step.stageName && step.stageName.trim().toLowerCase() === rawStage.trim().toLowerCase()
        );
    }

    if (!matchedStep && stepsToUse.length > 0) {
        if (isCompleted) {
            matchedStep = stepsToUse[stepsToUse.length - 1];
            rawStage = matchedStep.stageName || rawStage;
        } else {
            matchedStep = stepsToUse[0];
            rawStage = matchedStep.stageName || rawStage;
        }
    }

    const bg = matchedStep 
        ? (matchedStep.colorGradient || matchedStep.colorHex) 
        : (isCompleted ? '#22C55E' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)');

    return (
        <span 
            className="px-3 py-1 text-white font-bold border-round text-xs shadow-1 inline-block"
            style={{ background: bg }}
        >
            {rawStage}
        </span>
    );
};
