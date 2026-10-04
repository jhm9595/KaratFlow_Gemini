import React from 'react';
import { getEventStageInfo } from '../../utils/pipeline';

interface LiveEventFeedProps {
    events: any[];
    feedViewMode: 'list' | 'card';
    onFeedViewModeChange: (mode: 'list' | 'card') => void;
    onEventClick: (event: any) => void;
    pipelineSteps?: any[];
}

export const LiveEventFeed: React.FC<LiveEventFeedProps> = ({
    events,
    feedViewMode,
    onFeedViewModeChange,
    onEventClick,
    pipelineSteps,
}) => {
    return (
        <div className="surface-0 p-3 border-round shadow-1 flex flex-column" style={{ width: '480px', minWidth: '420px' }}>
            <div className="flex justify-content-between align-items-center mb-3 border-bottom-1 border-200 pb-2">
                <div className="flex align-items-center gap-2">
                    <span className="w-0.5rem h-0.5rem bg-green-500 border-circle inline-block" style={{ animation: 'pulse 2s infinite' }}></span>
                    <h4 className="m-0 text-800 font-bold text-base">Live Event Feed</h4>
                </div>
                <div className="flex align-items-center surface-100 p-1 border-round-xl gap-1">
                    <button 
                        type="button"
                        onClick={() => onFeedViewModeChange('list')}
                        title="리스트 뷰"
                        className={`border-none border-round-lg cursor-pointer transition-all transition-duration-150 flex align-items-center justify-content-center ${
                            feedViewMode === 'list' 
                                ? 'bg-white text-primary font-bold shadow-1' 
                                : 'bg-transparent text-600 hover:text-900'
                        }`}
                        style={{ width: '30px', height: '30px' }}
                    >
                        <i className="pi pi-list text-sm font-bold"></i>
                    </button>
                    <button 
                        type="button"
                        onClick={() => onFeedViewModeChange('card')}
                        title="카드 뷰 (3열)"
                        className={`border-none border-round-lg cursor-pointer transition-all transition-duration-150 flex align-items-center justify-content-center ${
                            feedViewMode === 'card' 
                                ? 'bg-white text-primary font-bold shadow-1' 
                                : 'bg-transparent text-600 hover:text-900'
                        }`}
                        style={{ width: '30px', height: '30px' }}
                    >
                        <i className="pi pi-th-large text-sm font-bold"></i>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
                {events.length === 0 ? (
                    <div className="text-center text-gray-400 py-5 text-sm">최근 발생한 이벤트가 없습니다.</div>
                ) : feedViewMode === 'list' ? (
                    <div className="flex flex-column gap-3">
                        {events.map((ev, idx) => {
                            const stageInfo = getEventStageInfo(ev.message, pipelineSteps);
                            const isUnread = ev.isRead === false || ev.isRead === undefined;
                            return (
                                <div 
                                    key={`${ev.id || 'ev'}-${idx}`} 
                                    onClick={() => onEventClick(ev)}
                                    className={`surface-50 p-3 border-round shadow-1 fadein animation-duration-300 transition-all hover:surface-100 cursor-pointer ${isUnread ? 'unread-live-event-card' : ''}`}
                                    style={{ 
                                        borderLeft: `5px solid ${stageInfo.colorHex}`,
                                        borderTop: '1px solid #f1f5f9',
                                        borderRight: '1px solid #f1f5f9',
                                        borderBottom: '1px solid #f1f5f9'
                                    }}
                                >
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <div className="flex align-items-center gap-2">
                                            <span 
                                                className="text-white px-3 py-1 border-round-md font-extrabold text-xs shadow-1" 
                                                style={{ background: stageInfo.colorGradient || stageInfo.colorHex, letterSpacing: '0.3px' }}
                                            >
                                                {stageInfo.stageName}
                                            </span>
                                            {isUnread && (
                                                <span 
                                                    className="px-2 py-0.5 border-round font-bold text-white shadow-1 flex align-items-center" 
                                                    style={{ backgroundColor: '#ef4444', color: '#ffffff', fontSize: '10px', lineHeight: 1 }}
                                                >
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-500 font-mono flex align-items-center gap-1">
                                            <i className="pi pi-clock text-xs text-400"></i> {ev.time}
                                        </span>
                                    </div>
                                    <div className="text-sm text-900 line-height-3 font-medium px-1">
                                        {ev.message}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-nogutter gap-2 align-content-start">
                        {events.map((ev, idx) => {
                            const stageInfo = getEventStageInfo(ev.message, pipelineSteps);
                            const isUnread = ev.isRead === false || ev.isRead === undefined;
                            return (
                                <div key={`${ev.id || 'ev'}-${idx}`} className="col-4">
                                    <div 
                                        onClick={() => onEventClick(ev)}
                                        className={`p-2 border-round shadow-1 fadein animation-duration-300 flex flex-column justify-content-between h-full cursor-pointer hover:shadow-2 transition-all ${isUnread ? 'unread-live-event-card' : ''}`}
                                        style={{ 
                                            backgroundColor: stageInfo.bgColor, 
                                            borderTop: `4px solid ${stageInfo.colorHex}`,
                                            borderLeft: '1px solid #e2e8f0',
                                            borderRight: '1px solid #e2e8f0',
                                            borderBottom: '1px solid #e2e8f0',
                                            minHeight: '92px' 
                                        }}
                                    >
                                        <div className="flex justify-content-between align-items-center mb-1.5">
                                            <div className="flex align-items-center gap-1">
                                                <span 
                                                    className="text-white px-2 py-0.5 border-round font-extrabold" 
                                                    style={{ background: stageInfo.colorGradient || stageInfo.colorHex, fontSize: '11px' }}
                                                >
                                                    {stageInfo.stageName}
                                                </span>
                                                {isUnread && (
                                                    <span 
                                                        className="border-circle inline-block shadow-1" 
                                                        style={{ backgroundColor: '#ef4444', width: '8px', height: '8px' }}
                                                    ></span>
                                                )}
                                            </div>
                                            <span className="text-500 font-mono font-semibold" style={{ fontSize: '10px' }}>{ev.time}</span>
                                        </div>
                                        <div className="text-xs text-900 font-medium line-height-2 mt-1 overflow-hidden" style={{ wordBreak: 'break-word', fontSize: '11px' }}>
                                            {ev.message}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveEventFeed;
