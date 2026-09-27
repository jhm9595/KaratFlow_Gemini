import React from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip 
} from 'recharts';
import { Button } from 'primereact/button';

interface GoldWidgetProps {
    todayGold?: any;
    yesterdayGold?: any;
    delta24k?: number;
    goldPriceData: any[];
    onOpenCalculator?: () => void;
}

const GoldWidget: React.FC<GoldWidgetProps> = ({ 
    goldPriceData,
    onOpenCalculator 
}) => {
    if (!goldPriceData || goldPriceData.length === 0) {
        return (
            <div className="surface-0 p-4 border-round shadow-1 flex-1 flex align-items-center justify-content-center">
                <i className="pi pi-spin pi-spinner text-2xl mr-2 text-primary"></i>
                <span className="text-600 font-medium">금 시세 데이터 로딩 중...</span>
            </div>
        );
    }

    // 1. Process data: frontend calculation of 24k, 18k, 14k prices per 1-don (3.75g) from g-unit price
    const processedData = goldPriceData.map(item => {
        const gram = item.pricePerGram || (item.price24k ? item.price24k / 3.75 : 0);
        const price24k = Math.round(gram * 3.75);
        const price18k = Math.round((price24k * 0.825) / 100) * 100;
        const price14k = Math.round((price24k * 0.6435) / 100) * 100;
        return {
            ...item,
            gram,
            price24k,
            price18k,
            price14k
        };
    });

    const today = processedData[processedData.length - 1] || {};
    const yesterday = processedData.length > 1 ? processedData[processedData.length - 2] : today;

    const delta24k = (today.price24k || 0) - (yesterday.price24k || 0);
    const delta18k = (today.price18k || 0) - (yesterday.price18k || 0);
    const delta14k = (today.price14k || 0) - (yesterday.price14k || 0);

    const chart7DaysData = processedData.slice(Math.max(0, processedData.length - 7));

    const renderDelta = (delta: number) => {
        if (delta > 0) return <span className="text-red-500 text-xs font-bold flex align-items-center">▲ {delta.toLocaleString()}</span>;
        if (delta < 0) return <span className="text-blue-500 text-xs font-bold flex align-items-center">▼ {Math.abs(delta).toLocaleString()}</span>;
        return <span className="text-500 text-xs font-bold flex align-items-center">- 0</span>;
    };

    const volumeG = today.volume ? Math.round(today.volume).toLocaleString() : '0';
    const valueEok = today.value ? (today.value / 100000000).toFixed(1) : '0';

    return (
        <div className="surface-0 p-3 border-round shadow-1 flex flex-column gap-3">
            {/* Header */}
            <div className="flex justify-content-between align-items-center">
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-sun text-warning text-xl"></i>
                    <h4 className="m-0 font-bold text-900 text-lg">오늘의 금 시세 <span className="text-xs text-500 font-normal">(한돈 3.75g 기준)</span></h4>
                </div>
                {onOpenCalculator && (
                    <Button 
                        icon="pi pi-calculator" 
                        className="p-button-rounded p-button-outlined p-button-warning p-button-sm" 
                        tooltip="금 시세 계산 도구" 
                        tooltipOptions={{ position: 'left' }} 
                        onClick={onOpenCalculator} 
                    />
                )}
            </div>

            {/* Top 3 Cards */}
            <div className="grid grid-nogutter gap-2">
                <div className="col surface-100 p-2 border-round flex flex-column justify-content-between border-left-3 border-warning">
                    <span className="text-xs text-600 font-medium">24K (순금 한돈)</span>
                    <span className="text-base font-bold text-900 my-1">₩{(today.price24k || 0).toLocaleString()}</span>
                    <div>{renderDelta(delta24k)}</div>
                </div>

                <div className="col surface-100 p-2 border-round flex flex-column justify-content-between border-left-3 border-orange-400">
                    <span className="text-xs text-600 font-medium">18K (한돈)</span>
                    <span className="text-base font-bold text-900 my-1">₩{(today.price18k || 0).toLocaleString()}</span>
                    <div>{renderDelta(delta18k)}</div>
                </div>

                <div className="col surface-100 p-2 border-round flex flex-column justify-content-between border-left-3 border-yellow-600">
                    <span className="text-xs text-600 font-medium">14K (한돈)</span>
                    <span className="text-base font-bold text-900 my-1">₩{(today.price14k || 0).toLocaleString()}</span>
                    <div>{renderDelta(delta14k)}</div>
                </div>
            </div>

            {/* Sub Metrics: Trading Volume & Value */}
            <div className="flex gap-2">
                <div className="flex-1 surface-50 p-2 border-round flex justify-content-between align-items-center">
                    <span className="text-xs text-600">오늘 거래량</span>
                    <span className="text-xs font-bold text-800">{volumeG} g</span>
                </div>
                <div className="flex-1 surface-50 p-2 border-round flex justify-content-between align-items-center">
                    <span className="text-xs text-600">오늘 거래대금</span>
                    <span className="text-xs font-bold text-800">{valueEok} 억 원</span>
                </div>
            </div>

            {/* 7-Day Trend Chart */}
            <div className="flex flex-column gap-1">
                <div className="flex justify-content-between align-items-center">
                    <span className="text-xs font-semibold text-600">최근 7일 순금(24K) 시세 동향</span>
                    <span className="text-xs text-400">KRX 기준</span>
                </div>
                <div className="w-full" style={{ height: '140px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chart7DaysData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gold7DayGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#fef3c7" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis domain={['dataMin - 2000', 'dataMax + 2000']} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => Math.round(v / 1000) + 'k'} />
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                                formatter={(val: any) => [`₩${Number(val).toLocaleString()}`, '24K 순금']}
                            />
                            <Area type="monotone" dataKey="price24k" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#gold7DayGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default GoldWidget;
