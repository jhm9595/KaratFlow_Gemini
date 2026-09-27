import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface GoldWidgetProps {
    todayGold: any;
    yesterdayGold: any;
    delta24k: number;
    delta18k: number;
    delta14k: number;
    goldPriceData: any[];
}

const GoldWidget: React.FC<GoldWidgetProps> = ({ todayGold, yesterdayGold, delta24k, delta18k, delta14k, goldPriceData }) => {
    
    const renderDelta = (delta: number) => {
        if (delta > 0) return <span className="text-red-500 text-sm font-bold">▲{delta.toLocaleString()}</span>;
        if (delta < 0) return <span className="text-blue-500 text-sm font-bold">▼{Math.abs(delta).toLocaleString()}</span>;
        return <span className="text-600 text-sm font-bold">-</span>;
    };

    if (!todayGold || !yesterdayGold) {
        return <div className="surface-0 p-3 border-round shadow-1 flex-1 flex align-items-center justify-content-center">로딩중...</div>;
    }

    return (
        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
            <div className="flex justify-content-between align-items-center mb-3">
                <h4 className="m-0 text-600 font-medium">오늘의 금 시세 (한돈 3.75g 기준)</h4>
            </div>
            
            {/* Top 3 Cards - 1돈 (3.75g) 기준 표시 */}
            <div className="flex gap-2 mb-3">
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">24K (순금 한돈)</div>
                    <div className="font-bold text-yellow-600 text-lg">₩{todayGold.price24k ? todayGold.price24k.toLocaleString() : '-'}</div>
                    <div className="mt-1">{renderDelta(delta24k)}</div>
                </div>
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">18K (한돈)</div>
                    <div className="font-bold text-orange-500 text-lg">₩{todayGold.price18k ? todayGold.price18k.toLocaleString() : '-'}</div>
                    <div className="mt-1">{renderDelta(delta18k)}</div>
                </div>
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">14K (한돈)</div>
                    <div className="font-bold text-purple-500 text-lg">₩{todayGold.price14k ? todayGold.price14k.toLocaleString() : '-'}</div>
                    <div className="mt-1">{renderDelta(delta14k)}</div>
                </div>
            </div>

            {/* 거래량 & 거래대금 */}
            <div className="flex gap-2 mb-3">
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">오늘 거래량 (1g 단위)</div>
                    <div className="font-bold text-700">{todayGold.volume ? todayGold.volume.toLocaleString() + 'g' : '-'}</div>
                </div>
                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                    <div className="text-xs text-600 mb-1">오늘 거래대금</div>
                    <div className="font-bold text-700">{todayGold.value ? '₩' + (todayGold.value / 100000000).toLocaleString(undefined, {maximumFractionDigits: 1}) + '억' : '-'}</div>
                </div>
            </div>

            {/* 24K 기준 2개 선 차트 (한돈 3.75g 시세 vs g당 시세) */}
            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={goldPriceData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="color24k" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.7}/>
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorGram" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.7}/>
                                <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#eab308'}} axisLine={false} tickLine={false} tickFormatter={(val) => (val/10000) + '만'} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#0284c7'}} axisLine={false} tickLine={false} tickFormatter={(val) => (val/10000) + '만'} />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} 
                            formatter={(value: any, name: any) => [`₩${Number(value).toLocaleString()}`, name]} 
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area yAxisId="left" type="monotone" dataKey="price24k" name="24K 한돈 (3.75g)" stroke="#eab308" strokeWidth={2.5} fillOpacity={1} fill="url(#color24k)" />
                        <Area yAxisId="right" type="monotone" dataKey="pricePerGram" name="24K g당 시세" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGram)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default GoldWidget;
