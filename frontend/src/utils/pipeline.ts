export const formatElapsed = (start: string | null, end: string | null) => {
    if (!start || !end) return '';
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';
    const diff = Math.max(0, d2.getTime() - d1.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    let str = '+';
    if (days > 0) str += `${days}일 `;
    if (hours > 0) str += `${hours}시간 `;
    if (mins > 0 || str === '+') str += `${mins}분`;
    return str;
};

export const getTimelineEvents = (rowData: any) => {
    if (!rowData) return [];
    const events = [
        { stage: '주문 생성', date: rowData.createdAt, icon: 'pi pi-file', color: '#9E9E9E' },
        { stage: '접수', date: rowData.pendingCompletedAt, icon: 'pi pi-check', color: '#64748B' },
        { stage: 'CAD', date: rowData.cadCompletedAt, icon: 'pi pi-desktop', color: '#3B82F6' },
        { stage: '주물 (Casting)', date: rowData.castingCompletedAt, icon: 'pi pi-box', color: '#F97316' },
        { stage: '세공 (Polishing)', date: rowData.polishingCompletedAt, icon: 'pi pi-star', color: '#EAB308' },
        { stage: '도금/검수', date: rowData.platingCompletedAt, icon: 'pi pi-eye', color: '#22C55E' }
    ];
    
    let validEvents = events.filter(e => e.date);
    
    return validEvents.map((ev, i) => {
        let elapsed = '';
        if (i > 0) {
            elapsed = formatElapsed(validEvents[i-1].date, ev.date);
        }
        return { ...ev, elapsed };
    });
};

export const getEventBorderColor = (msg: string) => {
    if (!msg) return '#3B82F6';
    if (msg.includes('접수') || msg.includes('신규')) return '#64748B';
    if (msg.includes('CAD')) return '#3B82F6';
    if (msg.includes('주물')) return '#F59E0B';
    if (msg.includes('세공')) return '#EF4444';
    if (msg.includes('완성')) return '#22C55E';
    if (msg.includes('보류') || msg.includes('HOLD')) return '#EAB308';
    return '#3B82F6';
};

export const getEventStageInfo = (msg: string, pipelineSteps?: any[]) => {
    if (!msg) return { stageName: '알림', colorHex: '#3B82F6', colorGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', bgColor: '#eff6ff' };
    
    let matchedStep = (pipelineSteps && pipelineSteps.length > 0) 
        ? pipelineSteps.find((step: any) => step.stageName && msg.includes(step.stageName)) 
        : null;

    if (!matchedStep) {
        if (msg.includes('접수') || msg.includes('신규')) {
            matchedStep = { stageName: '접수', colorHex: '#38BDF8', colorGradient: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)', bgColor: '#f0f9ff' };
        } else if (msg.includes('CAD')) {
            matchedStep = { stageName: 'CAD', colorHex: '#C084FC', colorGradient: 'linear-gradient(135deg, #e879f9 0%, #c084fc 100%)', bgColor: '#fdf4ff' };
        } else if (msg.includes('주물')) {
            matchedStep = { stageName: '주물', colorHex: '#F59E0B', colorGradient: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)', bgColor: '#fffbeb' };
        } else if (msg.includes('세공')) {
            matchedStep = { stageName: '세공', colorHex: '#EF4444', colorGradient: 'linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)', bgColor: '#fef2f2' };
        } else if (msg.includes('완료') || msg.includes('완성')) {
            matchedStep = { stageName: '완료', colorHex: '#22C55E', colorGradient: 'linear-gradient(135deg, #86efac 0%, #22c55e 100%)', bgColor: '#f0fdf4' };
        } else if (msg.includes('보류') || msg.includes('HOLD')) {
            matchedStep = { stageName: '보류', colorHex: '#EAB308', colorGradient: 'linear-gradient(135deg, #fde047 0%, #eab308 100%)', bgColor: '#fefce8' };
        }
    }

    if (matchedStep) {
        return {
            stageName: matchedStep.stageName || '공정',
            colorHex: matchedStep.colorHex || '#3B82F6',
            colorGradient: matchedStep.colorGradient || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            bgColor: matchedStep.bgColor || '#f8fafc'
        };
    }

    return { stageName: '알림', colorHex: '#3B82F6', colorGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', bgColor: '#eff6ff' };
};
