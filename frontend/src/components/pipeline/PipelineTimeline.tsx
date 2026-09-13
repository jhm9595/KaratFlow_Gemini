import React from 'react';
import { Timeline } from 'primereact/timeline';
import { formatDistanceToNow, differenceInMinutes, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PipelineTimelineProps {
    events: any[];
}

const PipelineTimeline: React.FC<PipelineTimelineProps> = ({ events }) => {

    const formatElapsed = (start: string, end: string) => {
        if (!start || !end) return '';
        const s = parseISO(start);
        const e = parseISO(end);
        const mins = differenceInMinutes(e, s);
        if (mins < 60) return `${mins}분`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `${hours}시간 ${remainingMins}분` : `${hours}시간`;
    };

    // Calculate elapsed dynamically
    const processedEvents = events.map((ev, i) => {
        let elapsed = '';
        if (i > 0 && events[i-1].date && ev.date) {
            elapsed = formatElapsed(events[i-1].date, ev.date);
        }
        return { ...ev, elapsed };
    });

    const customizedMarker = (item: any) => {
        return (
            <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: item.color }}>
                <i className={item.icon}></i>
            </span>
        );
    };

    const customizedContent = (item: any) => {
        const isCompleted = !!item.date;
        return (
            <div className="flex flex-column align-items-center mb-4">
                <div className={`font-bold ${isCompleted ? 'text-800' : 'text-500'}`}>{item.stage}</div>
                {isCompleted && (
                    <div className="text-sm text-600 mt-1">
                        {new Date(item.date).toLocaleString()}
                    </div>
                )}
                {item.elapsed && (
                    <div className="text-xs text-primary font-bold mt-1 bg-blue-50 px-2 py-1 border-round">
                        소요: {item.elapsed}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="overflow-x-auto w-full">
            <Timeline 
                value={processedEvents} 
                align="top" 
                layout="horizontal" 
                className="customized-timeline" 
                marker={customizedMarker} 
                content={customizedContent} 
            />
        </div>
    );
};

export default PipelineTimeline;
