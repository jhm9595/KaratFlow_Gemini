import React from 'react';
import GoldWidget from '../widgets/GoldWidget';
import { PetroleumChart } from '../charts/PetroleumChart';
import { KospiChart } from '../charts/KospiChart';

interface DashboardSidebarProps {
    orders: any[];
    todayGold: any;
    yesterdayGold: any;
    delta24k: number | null;
    goldPriceData: any[];
    onOpenGoldTools: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
    orders,
    todayGold,
    yesterdayGold,
    delta24k,
    goldPriceData,
    onOpenGoldTools,
}) => {
    const activeOrderCount = orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'COMPLETED').length;
    const completedTodayCount = orders.filter(o => o.status === 'COMPLETED').length;

    return (
        <div className="flex flex-column gap-3 h-full flex-shrink-0" style={{ width: '450px', height: '100%', overflow: 'hidden' }}>
            {/* 1. Ultra-compact Stat Bar */}
            <div className="surface-0 px-3 py-2 border-round-xl shadow-1 flex justify-content-between align-items-center flex-shrink-0" style={{ border: '1px solid #e2e8f0' }}>
                <div className="flex align-items-center gap-2">
                    <div className="flex align-items-center justify-content-center border-circle" style={{ width: '26px', height: '26px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <i className="pi pi-chart-pie text-xs font-bold" />
                    </div>
                    <span className="text-800 font-bold text-sm">실시간 핵심 지표</span>
                </div>
                <div className="flex align-items-center gap-2">
                    <span className="px-2 py-1 border-round-md text-xs font-semibold" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                        진행중 <b className="text-blue-600 font-bold ml-1">{activeOrderCount}</b>건
                    </span>
                    <span className="px-2 py-1 border-round-md text-xs font-semibold" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                        금일완료 <b className="text-green-600 font-bold ml-1">{completedTodayCount}</b>건
                    </span>
                </div>
            </div>

            {/* 2. 금 시세 (Compact 3.75g Widget - flex-1) */}
            <div className="flex-1 min-h-0 flex flex-column">
                <GoldWidget 
                    todayGold={todayGold} 
                    yesterdayGold={yesterdayGold} 
                    delta24k={delta24k ?? undefined} 
                    goldPriceData={goldPriceData} 
                    onOpenCalculator={onOpenGoldTools} 
                />
            </div>

            {/* 3. 석유 시세 (독립 컴포넌트 - flex-1) */}
            <div className="flex-1 min-h-0 flex flex-column">
                <PetroleumChart />
            </div>

            {/* 4. 코스피 지수 (독립 컴포넌트 - flex-1) */}
            <div className="flex-1 min-h-0 flex flex-column">
                <KospiChart />
            </div>
        </div>
    );
};

export default DashboardSidebar;
