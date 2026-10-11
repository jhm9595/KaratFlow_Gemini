import React, { useState } from 'react';
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
    const [chartMode, setChartMode] = useState<'24k' | 'all'>('24k');

    if (!goldPriceData || goldPriceData.length === 0) {
        return (
            <div className="surface-0 p-3 border-round shadow-1 flex-1 flex align-items-center justify-content-center">
                <i className="pi pi-spin pi-spinner text-2xl mr-2 text-primary"></i>
                <span className="text-600 font-medium">로딩중...</span>
            </div>
        );
    }

    // Use backend-provided derived prices directly; fallback to calculation only if missing
    const processedData = goldPriceData.map(item => {
        const p24 = item.price24k ?? Math.round((item.pricePerGram || 0) * 3.75);
        const p18 = item.price18k ?? Math.round((p24 * 0.825) / 100) * 100;
        const p14 = item.price14k ?? Math.round((p24 * 0.6435) / 100) * 100;
        return {
            ...item,
            price24k: p24,
            price18k: p18,
            price14k: p14
        };
    });

    // Slice recent 7 days for the chart
    const rawChartData = processedData.slice(Math.max(0, processedData.length - 7));
    const chartData = rawChartData.map(d => ({
        ...d,
        date: d.priceDate ? `${String(new Date(d.priceDate).getMonth() + 1).padStart(2, '0')}/${String(new Date(d.priceDate).getDate()).padStart(2, '0')}` : d.date
    }));

    const today = processedData[processedData.length - 1] || {};
    const yesterday = processedData.length > 1 ? processedData[processedData.length - 2] : today;

    const delta24k = (today.price24k || 0) - (yesterday.price24k || 0);
    const delta18k = (today.price18k || 0) - (yesterday.price18k || 0);
    const delta14k = (today.price14k || 0) - (yesterday.price14k || 0);

    const renderDelta = (delta: number) => {
        if (delta > 0) return <span className="text-red-500 font-bold">▲{delta.toLocaleString()}</span>;
        if (delta < 0) return <span className="text-blue-500 font-bold">▼{Math.abs(delta).toLocaleString()}</span>;
        return null;
    };

    // Calculate dynamic Y-axis min and max so price fluctuations produce clear, prominent curves
    const min24k = Math.min(...chartData.map(d => d.price24k || 9999999));
    const max24k = Math.max(...chartData.map(d => d.price24k || 0));
    
    const minAll = Math.min(...chartData.map(d => d.price14k || 9999999));
    const maxAll = Math.max(...chartData.map(d => d.price24k || 0));

    const yMin = chartMode === '24k' 
        ? Math.floor((min24k - 2000) / 1000) * 1000 
        : Math.floor((minAll - 5000) / 1000) * 1000;
    const yMax = chartMode === '24k' 
        ? Math.ceil((max24k + 2000) / 1000) * 1000 
        : Math.ceil((maxAll + 5000) / 1000) * 1000;

    return (
        <div className="surface-0 p-3 border-round-xl shadow-1 flex flex-column justify-content-between h-full flex-1" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)', minHeight: '0' }}>
            {/* Header section with title and harmonious controls */}
            <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 border-100">
                <div className="flex align-items-center gap-2">
                    <div className="flex align-items-center justify-content-center border-circle" style={{ width: '28px', height: '28px', backgroundColor: '#fef3c7', color: '#d97706' }}>
                        <i className="pi pi-dollar text-sm font-bold" />
                    </div>
                    <h4 className="m-0 text-800 font-bold text-base flex align-items-center gap-1">오늘의 금 시세 <span className="text-xs text-500 font-normal ml-1">(3.75g 기준)</span></h4>
                </div>
                
                <div className="flex align-items-center gap-1.5">
                    {/* Sleek Segmented Control Pill Switch */}
                    <div 
                        className="flex align-items-center p-0.5 gap-1" 
                        style={{ 
                            backgroundColor: '#f1f5f9', 
                            borderRadius: '9999px',
                            border: '1px solid #e2e8f0' 
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setChartMode('24k')}
                            title="24K 순금 추이 (굴곡 강조)"
                            className="border-none cursor-pointer flex align-items-center gap-1 transition-all transition-duration-200"
                            style={{
                                borderRadius: '9999px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: chartMode === '24k' ? '#d97706' : 'transparent',
                                color: chartMode === '24k' ? '#ffffff' : '#64748b',
                                boxShadow: chartMode === '24k' ? '0 1px 4px rgba(217, 119, 6, 0.35)' : 'none'
                            }}
                        >
                            <span>24K</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setChartMode('all')}
                            title="전체 비교 (24K / 18K / 14K)"
                            className="border-none cursor-pointer flex align-items-center gap-1 transition-all transition-duration-200"
                            style={{
                                borderRadius: '9999px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: chartMode === 'all' ? '#4f46e5' : 'transparent',
                                color: chartMode === 'all' ? '#ffffff' : '#64748b',
                                boxShadow: chartMode === 'all' ? '0 1px 4px rgba(79, 70, 229, 0.35)' : 'none'
                            }}
                        >
                            <span>전체</span>
                        </button>
                    </div>

                    {/* Harmonized Calculator Pill Button */}
                    {onOpenCalculator && (
                        <button
                            type="button"
                            onClick={onOpenCalculator}
                            title="금 시세 계산 도구"
                            className="border-none cursor-pointer flex align-items-center justify-content-center transition-all transition-duration-200"
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '9999px',
                                backgroundColor: '#fff7ed',
                                color: '#d97706',
                                border: '1px solid #fed7aa'
                            }}
                        >
                            <i className="pi pi-calculator text-xs" />
                        </button>
                    )}
                </div>
            </div>
            
            {/* 3 Top Cards (24K, 18K, 14K) with subtle accent top borders */}
            <div className="flex gap-2 mb-2">
                <div 
                    className="flex-1 p-1.5 text-center transition-all flex flex-column justify-content-center"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderTop: '3px solid #eab308'
                    }}
                >
                    <div className="text-xs text-500 font-semibold mb-0.5">24K (순금)</div>
                    <div className="font-bold text-amber-600 text-sm">₩{(today.price24k || 0).toLocaleString()}</div>
                    {renderDelta(delta24k) && <div className="mt-0.5" style={{ fontSize: '10px' }}>{renderDelta(delta24k)}</div>}
                </div>
                <div 
                    className="flex-1 p-1.5 text-center transition-all flex flex-column justify-content-center"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderTop: '3px solid #f97316'
                    }}
                >
                    <div className="text-xs text-500 font-semibold mb-0.5">18K</div>
                    <div className="font-bold text-orange-600 text-sm">₩{(today.price18k || 0).toLocaleString()}</div>
                    {renderDelta(delta18k) && <div className="mt-0.5" style={{ fontSize: '10px' }}>{renderDelta(delta18k)}</div>}
                </div>
                <div 
                    className="flex-1 p-1.5 text-center transition-all flex flex-column justify-content-center"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderTop: '3px solid #a855f7'
                    }}
                >
                    <div className="text-xs text-500 font-semibold mb-0.5">14K</div>
                    <div className="font-bold text-purple-600 text-sm">₩{(today.price14k || 0).toLocaleString()}</div>
                    {renderDelta(delta14k) && <div className="mt-0.5" style={{ fontSize: '10px' }}>{renderDelta(delta14k)}</div>}
                </div>
            </div>

            {/* Graph with 24K, 18K, 14K Area lines */}
            <div className="w-full flex-1" style={{ minHeight: '80px', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="color24k" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="color18k" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="color14k" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.01}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis 
                            domain={[yMin, yMax]} 
                            tick={{fontSize: 10, fill: '#64748b'}} 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(val) => (val / 10000).toFixed(1) + '만'} 
                        />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px' }} 
                            formatter={(value: any) => `₩${Number(value).toLocaleString()}`} 
                            itemSorter={(item: any) => {
                                const name = item.name || item.dataKey || '';
                                if (name.includes('24')) return 1;
                                if (name.includes('18')) return 2;
                                if (name.includes('14')) return 3;
                                return 4;
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} />
                        
                        <Area 
                            type="monotone" 
                            dataKey="price24k" 
                            name="24K" 
                            stroke="#eab308" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#color24k)" 
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                        />
                        
                        {chartMode === 'all' && (
                            <>
                                <Area 
                                    type="monotone" 
                                    dataKey="price18k" 
                                    name="18K" 
                                    stroke="#f97316" 
                                    strokeWidth={2} 
                                    fillOpacity={1} 
                                    fill="url(#color18k)" 
                                    dot={false}
                                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="price14k" 
                                    name="14K" 
                                    stroke="#a855f7" 
                                    strokeWidth={2} 
                                    fillOpacity={1} 
                                    fill="url(#color14k)" 
                                    dot={false}
                                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                                />
                            </>
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GoldWidget;
