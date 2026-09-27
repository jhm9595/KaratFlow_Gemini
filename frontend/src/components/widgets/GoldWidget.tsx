import React, { useState } from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip as RechartsTooltip, Cell, LabelList 
} from 'recharts';
import { Button } from 'primereact/button';

interface GoldWidgetProps {
    todayGold: any;
    yesterdayGold: any;
    delta24k: number;
    goldPriceData: any[];
    onOpenCalculator?: () => void;
}

const GoldWidget: React.FC<GoldWidgetProps> = ({ 
    todayGold, 
    yesterdayGold, 
    delta24k, 
    goldPriceData,
    onOpenCalculator 
}) => {
    const [period, setPeriod] = useState<'1M' | '5M' | '1Y' | '3Y'>('1M');

    if (!todayGold || !todayGold.price24k) {
        return (
            <div className="surface-0 p-4 border-round shadow-1 flex-1 flex align-items-center justify-content-center">
                <i className="pi pi-spin pi-spinner text-2xl mr-2 text-primary"></i>
                <span className="text-600 font-medium">금 시세 데이터 로딩 중...</span>
            </div>
        );
    }

    const todayPrice = todayGold.price24k || 0;
    const prevPrice = (yesterdayGold && yesterdayGold.price24k > 0) 
        ? yesterdayGold.price24k 
        : ((todayPrice - delta24k) > 0 ? (todayPrice - delta24k) : todayPrice);
    
    const diff = todayPrice - prevPrice;
    const percent = prevPrice > 0 ? ((diff / prevPrice) * 100).toFixed(2) : '0.00';
    const isUp = diff >= 0;

    // Mini comparison bar chart data
    const barData = [
        { name: '전일', price: prevPrice, fill: '#3b82f6' },
        { name: '오늘', price: todayPrice, fill: '#0ea5e9' }
    ];

    return (
        <div className="surface-0 p-4 border-round shadow-1 flex-1 flex flex-column" style={{ background: '#ffffff' }}>
            {/* 1. Header */}
            <div className="flex justify-content-between align-items-center mb-2">
                <div className="flex align-items-baseline gap-2">
                    <h3 className="m-0 font-bold text-900 text-xl" style={{ letterSpacing: '-0.5px' }}>
                        국내 시세
                    </h3>
                    <span className="text-xs text-500 font-normal">(KRW/3.75g)</span>
                </div>
                <div className="flex align-items-center gap-3">
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
                            tooltip="금 시세 심층 도구 및 계산기" 
                            tooltipOptions={{ position: 'bottom' }} 
                            onClick={onOpenCalculator} 
                        />
                    )}
                </div>
            </div>

            {/* 2. Controls Toolbar (Period Tabs & Action Icons) */}
            <div className="flex justify-content-end align-items-center gap-3 mb-3">
                {/* Period Selector Tabs */}
                <div className="flex gap-2 text-sm text-600 font-medium">
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
                                    borderBottom: isActive ? '2px solid #111827' : 'none',
                                    paddingBottom: '2px'
                                }}
                                className="hover:text-900 transition-colors"
                            >
                                {label}
                            </span>
                        );
                    })}
                </div>

                {/* Chart Control Icons */}
                <div className="flex align-items-center gap-2 text-400 text-sm">
                    <i className="pi pi-plus-circle hover:text-700 cursor-pointer" title="확대"></i>
                    <i className="pi pi-minus-circle hover:text-700 cursor-pointer" title="축소"></i>
                    <i className="pi pi-search hover:text-700 cursor-pointer" title="검색"></i>
                    <i className="pi pi-arrows-alt hover:text-700 cursor-pointer" title="이동"></i>
                    <i className="pi pi-home hover:text-700 cursor-pointer" title="초기화"></i>
                </div>
            </div>

            {/* 3. Main Trend Chart (AreaChart) */}
            <div className="w-full flex-1 mb-3" style={{ minHeight: '210px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={goldPriceData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ffedd5" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#6b7280' }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis 
                            domain={['dataMin - 5000', 'dataMax + 5000']} 
                            tick={{ fontSize: 11, fill: '#6b7280' }} 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(val) => val.toLocaleString()}
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

            {/* 4. Bottom Row: Bar Chart Comparison & Highlight Summary */}
            <div className="flex align-items-center gap-4 pt-3 border-top-1 border-100">
                {/* Left Mini Bar Chart */}
                <div style={{ width: '180px', height: '105px' }} className="flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 18, right: 10, left: 10, bottom: 0 }} barCategoryGap="25%">
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                <LabelList 
                                    dataKey="price" 
                                    position="top" 
                                    formatter={(val: any) => Number(val).toLocaleString()} 
                                    style={{ fontSize: '10px', fontWeight: 600, fill: '#1f2937' }} 
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Right Highlight Text Block */}
                <div className="flex-1 flex flex-column justify-content-center">
                    <div className="text-base text-800 font-semibold mb-1">
                        오늘 금시세는 전일 대비
                    </div>
                    <div className="flex align-items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-900">
                            {Math.abs(diff).toLocaleString()} 원
                        </span>
                        <span className={`text-xl font-bold flex align-items-center ${isUp ? 'text-red-500' : 'text-blue-500'}`}>
                            {isUp ? '▲' : '▼'} {Math.abs(Number(percent))}%
                        </span>
                        <span className="text-xl font-bold text-900">입니다.</span>
                    </div>
                    <div className="text-xs text-500 text-ellipsis overflow-hidden white-space-nowrap mt-1">
                        KRX 한국거래소 공식 시세 반영 · 실시간 가동 중
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoldWidget;
