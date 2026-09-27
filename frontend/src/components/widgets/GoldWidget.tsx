import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Button } from 'primereact/button';

interface GoldWidgetProps {
    todayGold?: any;
    yesterdayGold?: any;
    delta24k?: number;
    delta18k?: number;
    delta14k?: number;
    goldPriceData: any[];
    onOpenCalculator?: () => void;
}

const GoldWidget: React.FC<GoldWidgetProps> = ({ 
    goldPriceData, 
    onOpenCalculator 
}) => {
    if (!goldPriceData || goldPriceData.length === 0) {
        return (
            <div className="surface-0 p-3 border-round shadow-1 flex-1 flex align-items-center justify-content-center">
                <i className="pi pi-spin pi-spinner text-2xl mr-2 text-primary"></i>
                <span className="text-600 font-medium">로딩중...</span>
            </div>
        );
    }

    // Process data in frontend: calculate 24K, 18K, 14K prices per 1-don (3.75g) from g-unit price
    const processedData = goldPriceData.map(item => {
        const gram = item.pricePerGram || (item.price24k ? item.price24k / 3.75 : 0);
        const p24 = Math.round(gram * 3.75);
        const p18 = Math.round((p24 * 0.825) / 100) * 100;
        const p14 = Math.round((p24 * 0.6435) / 100) * 100;
        return {
            ...item,
            price24k: p24,
            price18k: p18,
            price14k: p14
        };
    });

    // Slice recent 7 days for the chart
    const chartData = processedData.slice(Math.max(0, processedData.length - 7));

    const today = processedData[processedData.length - 1] || {};
    const yesterday = processedData.length > 1 ? processedData[processedData.length - 2] : today;

    const delta24k = (today.price24k || 0) - (yesterday.price24k || 0);
    const delta18k = (today.price18k || 0) - (yesterday.price18k || 0);
    const delta14k = (today.price14k || 0) - (yesterday.price14k || 0);

    const renderDelta = (delta: number) => {
        if (delta > 0) return <span className="text-red-500 text-sm font-bold">▲{delta.toLocaleString()}</span>;
        if (delta < 0) return <span className="text-blue-500 text-sm font-bold">▼{Math.abs(delta).toLocaleString()}</span>;
        return <span className="text-600 text-sm font-bold">-</span>;
    };

    return (
        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
            <div className="flex justify-content-between align-items-center mb-3">
                <h4 className="m-0 text-600 font-medium">오늘의 금 시세 (3.75g 기준)</h4>
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
            
            {/* 3 Top Cards (24K, 18K, 14K) */}
            <div className="flex gap-2 mb-3">
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">24K (순금)</div>
                    <div className="font-bold text-yellow-600 text-lg">₩{(today.price24k || 0).toLocaleString()}</div>
                    <div className="mt-1">{renderDelta(delta24k)}</div>
                </div>
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">18K</div>
                    <div className="font-bold text-orange-500 text-lg">₩{(today.price18k || 0).toLocaleString()}</div>
                    <div className="mt-1">{renderDelta(delta18k)}</div>
                </div>
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">14K</div>
                    <div className="font-bold text-purple-500 text-lg">₩{(today.price14k || 0).toLocaleString()}</div>
                    <div className="mt-1">{renderDelta(delta14k)}</div>
                </div>
            </div>

            {/* 거래량 & 거래대금 */}
            <div className="flex gap-2 mb-3">
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">오늘 거래량 (1g 단위)</div>
                    <div className="font-bold text-700">{today.volume ? Math.round(today.volume).toLocaleString() + 'g' : '-'}</div>
                </div>
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">오늘 거래대금</div>
                    <div className="font-bold text-700">{today.value ? '₩' + (today.value / 100000000).toLocaleString(undefined, {maximumFractionDigits: 1}) + '억' : '-'}</div>
                </div>
            </div>

            {/* Graph with 24K, 18K, 14K Area lines */}
            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="color24k" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="color18k" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="color14k" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} tickFormatter={(val) => (val/10000) + '만'} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} formatter={(value: any) => `₩${Number(value).toLocaleString()}`} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="price24k" name="24K" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#color24k)" />
                        <Area type="monotone" dataKey="price18k" name="18K" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#color18k)" />
                        <Area type="monotone" dataKey="price14k" name="14K" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#color14k)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GoldWidget;
