import React, { useState } from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip as RechartsTooltip, Cell, LabelList 
} from 'recharts';
import { Button } from 'primereact/button';

interface GoldWidgetProps {
    todayGold: any;
    yesterdayGold?: any;
    delta24k?: number;
    goldPriceData: any[];
    onOpenCalculator?: () => void;
}

const GoldWidget: React.FC<GoldWidgetProps> = ({ 
    todayGold, 
    goldPriceData,
    onOpenCalculator 
}) => {
    const [period, setPeriod] = useState<'1M' | '5M' | '1Y' | '3Y'>('1M');

    if (!goldPriceData || goldPriceData.length === 0) {
        return (
            <div className="surface-0 p-4 border-round shadow-1 flex-1 flex align-items-center justify-content-center">
                <i className="pi pi-spin pi-spinner text-2xl mr-2 text-primary"></i>
                <span className="text-600 font-medium">금 시세 데이터 로딩 중...</span>
            </div>
        );
    }

    // 1. Process data: calculate 1-don (3.75g) dynamically from pricePerGram
    const processedData = goldPriceData.map(item => {
        const gram = item.pricePerGram || (item.price24k ? item.price24k / 3.75 : 0);
        const donPrice = Math.round(gram * 3.75);
        return {
            ...item,
            price24k: donPrice,
            gramPrice: gram
        };
    });

    // 2. Filter data by selected period
    let filteredData = processedData;
    if (period === '1M') {
        filteredData = processedData.slice(Math.max(0, processedData.length - 30));
    } else if (period === '5M') {
        filteredData = processedData.slice(Math.max(0, processedData.length - 150));
    } else if (period === '1Y') {
        filteredData = processedData.slice(Math.max(0, processedData.length - 365));
    } else if (period === '3Y') {
        filteredData = processedData;
    }

    // 3. Today price (latest in array)
    const latestItem = processedData[processedData.length - 1] || {};
    const todayDonPrice = latestItem.price24k || (todayGold?.price24k || 0);

    // 4. YoY (전년 대비) calculation: find entry ~365 days ago (or oldest available in DB)
    const yoyIndex = Math.max(0, processedData.length - 365);
    const prevYearItem = processedData[yoyIndex] || processedData[0] || {};
    const prevYearDonPrice = prevYearItem.price24k || todayDonPrice;

    const yoyDiff = todayDonPrice - prevYearDonPrice;
    const yoyPercent = prevYearDonPrice > 0 ? ((yoyDiff / prevYearDonPrice) * 100).toFixed(2) : '0.00';
    const isUp = yoyDiff >= 0;

    // Mini comparison bar chart data (전년 vs 오늘)
    const barData = [
        { name: '전년', price: prevYearDonPrice, fill: '#3b82f6' },
        { name: '오늘', price: todayDonPrice, fill: '#0ea5e9' }
    ];

    return (
        <div 
            className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column" 
            style={{ background: '#ffffff', overflowX: 'hidden', maxWidth: '100%', boxSizing: 'border-box' }}
        >
            {/* 1. Header */}
            <div className="flex justify-content-between align-items-center mb-2">
                <div className="flex align-items-baseline gap-2">
                    <h3 className="m-0 font-bold text-900 text-xl" style={{ letterSpacing: '-0.5px' }}>
                        국내 시세
                    </h3>
                    <span className="text-xs text-500 font-normal">(KRW/3.75g)</span>
                </div>
                <div className="flex align-items-center gap-2">
                    <button 
                        onClick={onOpenCalculator}
                        className="p-link text-xs text-500 hover:text-700 flex align-items-center gap-1"
                        style={{ textDecoration: 'none', cursor: 'pointer' }}
                    >
                        <span>국내 시세 전체보기</span>
                        <i className="pi pi-chevron-right text-xs"></i>
                    </button>
                    {onOpenCalculator && (
                        <Button 
                            icon="pi pi-calculator" 
                            className="p-button-rounded p-button-outlined p-button-warning p-button-sm" 
                            tooltip="금 시세 계산 도구" 
                            tooltipOptions={{ position: 'bottom' }} 
                            onClick={onOpenCalculator} 
                        />
                    )}
                </div>
            </div>

            {/* 2. Period Selector Tabs (Zoom/Home icons deleted per user request) */}
            <div className="flex justify-content-end align-items-center mb-3">
                <div className="flex gap-3 text-sm text-600 font-medium">
                    {(['1개월', '5개월', '1년', '3년'] as const).map((label, idx) => {
                        const key = (['1M', '5M', '1Y', '3Y'] as const)[idx];
                        const isActive = period === key;
                        return (
                            <span
                                key={key}
                                onClick={() => setPeriod(key)}
                                style={{
                                    cursor: 'pointer',
                                    color: isActive ? '#111827' : '#6b7280',
                                    fontWeight: isActive ? 700 : 400,
                                    borderBottom: isActive ? '2px solid #111827' : '2px solid transparent',
                                    paddingBottom: '2px'
                                }}
                                className="hover:text-900 transition-colors"
                            >
                                {label}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* 3. Main Trend Chart (AreaChart) */}
            <div className="w-full mb-2" style={{ height: '150px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ffedd5" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: '#6b7280' }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis 
                            domain={['dataMin - 5000', 'dataMax + 5000']} 
                            tick={{ fontSize: 10, fill: '#6b7280' }} 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(val) => val.toLocaleString()}
                            width={55}
                        />
                        <RechartsTooltip 
                            contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                borderRadius: '8px', 
                                border: '1px solid #e5e7eb', 
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                color: '#1f2937' 
                            }} 
                            formatter={(value: any) => [`₩${Number(value).toLocaleString()}`, '순금(24K) 1돈']} 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="price24k" 
                            stroke="#ea580c" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#goldGradient)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* 4. Bottom Row: YoY Bar Chart Comparison & Highlight Summary */}
            <div className="flex align-items-center gap-2 pt-2 border-top-1 border-100 flex-shrink-0" style={{ minHeight: '95px' }}>
                {/* Left Mini Bar Chart (전년 vs 오늘) */}
                <div style={{ width: '130px', height: '95px' }} className="flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 16, right: 5, left: 5, bottom: 0 }} barCategoryGap="20%">
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                <LabelList 
                                    dataKey="price" 
                                    position="top" 
                                    formatter={(val: any) => Number(val).toLocaleString()} 
                                    style={{ fontSize: '9px', fontWeight: 600, fill: '#1f2937' }} 
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Right Highlight Text Block (전년 대비) */}
                <div className="flex-1 flex flex-column justify-content-center min-w-0" style={{ overflow: 'hidden' }}>
                    <div className="text-sm text-800 font-semibold mb-1 white-space-nowrap">
                        오늘 금시세는 전년 대비
                    </div>
                    <div className="flex align-items-baseline gap-1 mb-1 white-space-nowrap overflow-hidden">
                        <span className="text-lg font-bold text-900">
                            {Math.abs(yoyDiff).toLocaleString()} 원
                        </span>
                        <span className={`text-base font-bold flex align-items-center ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
                            {isUp ? '▲' : '▼'} {Math.abs(Number(yoyPercent))}%
                        </span>
                        <span className="text-base font-bold text-900">입니다.</span>
                    </div>
                    <div className="text-xs text-500 text-ellipsis overflow-hidden white-space-nowrap">
                        KRX 한국거래소 공식 시세 반영 · 실시간 3년 데이터
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoldWidget;
