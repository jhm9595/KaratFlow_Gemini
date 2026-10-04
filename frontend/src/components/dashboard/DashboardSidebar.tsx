import React from 'react';
import GoldWidget from '../widgets/GoldWidget';
import { PetroleumChart } from '../charts/PetroleumChart';
import { KospiChart } from '../charts/KospiChart';

interface DashboardSidebarProps {
    orders: any[];
    todayGold: number | null;
    yesterdayGold: number | null;
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
        <div className="flex flex-column gap-3 overflow-y-auto" style={{ width: '450px', maxHeight: '100%', overflowX: 'hidden' }}>
            <div className="surface-0 p-3 border-round shadow-1">
                <h4 className="m-0 mb-3 text-600 font-medium">실시간 핵심 지표</h4>
                <div className="flex justify-content-between align-items-end mb-3">
                    <span className="text-600">진행중 주문</span>
                    <span className="text-3xl font-bold text-900">{activeOrderCount} <small className="text-sm font-normal text-gray-500">건</small></span>
                </div>
                <div className="flex justify-content-between align-items-end mb-3">
                    <span className="text-600">금일 완료</span>
                    <span className="text-3xl font-bold text-green-400">{completedTodayCount} <small className="text-sm font-normal text-gray-500">건</small></span>
                </div>
            </div>

            {/* 금 시세 (국내 시세 3.75g 기준 위젯) */}
            <GoldWidget 
                todayGold={todayGold} 
                yesterdayGold={yesterdayGold} 
                delta24k={delta24k ?? undefined} 
                goldPriceData={goldPriceData} 
                onOpenCalculator={onOpenGoldTools} 
            />

            {/* 2. 석유 시세 */}
            <PetroleumChart />

            {/* 3. 코스피 지수 */}
            <KospiChart />
        </div>
    );
};

export default DashboardSidebar;
