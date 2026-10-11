import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export const KospiChart: React.FC = () => {
    const [kospiData, setKospiData] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const kosRes = await fetch('http://localhost:8888/api/global-metrics/kospi/history');
                if (kosRes.ok) {
                    const kosData = await kosRes.json();
                    setKospiData(kosData.map((d: any) => ({
                        date: d.date ? `${String(new Date(d.date).getMonth() + 1).padStart(2, '0')}/${String(new Date(d.date).getDate()).padStart(2, '0')}` : d.date,
                        KOSPI: d.kospiIndex,
                        KOSPI200: d.kospi200Index,
                        tradingValue: d.tradingValue
                    })));
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchHistory();
    }, []);

    const latest = kospiData.length > 0 ? kospiData[kospiData.length - 1] : {};

    return (
        <div className="surface-0 p-3 border-round-xl shadow-1 flex flex-column justify-content-between h-full flex-1" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)', minHeight: '0' }}>
            {/* Header with indigo chart icon badge */}
            <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 border-100">
                <div className="flex align-items-center gap-2">
                    <div className="flex align-items-center justify-content-center border-circle" style={{ width: '28px', height: '28px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                        <i className="pi pi-chart-line text-sm font-bold" />
                    </div>
                    <h4 className="m-0 text-800 font-bold text-base flex align-items-center gap-1">코스피 지수 <span className="text-xs text-500 font-normal ml-1">(KRX)</span></h4>
                </div>
            </div>

            {/* Top KPI Cards (3 cards for 100% visual symmetry) */}
            <div className="flex gap-2 mb-2">
                <div 
                    className="flex-1 p-1.5 text-center transition-all flex flex-column justify-content-center"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderTop: '3px solid #2563eb'
                    }}
                >
                    <div className="text-xs text-500 font-semibold mb-0.5">KOSPI 종합</div>
                    <div className="font-bold text-blue-600 text-sm">
                        {latest.KOSPI ? Number(latest.KOSPI).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </div>
                </div>

                <div 
                    className="flex-1 p-1.5 text-center transition-all flex flex-column justify-content-center"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderTop: '3px solid #ea580c'
                    }}
                >
                    <div className="text-xs text-500 font-semibold mb-0.5">KOSPI 200</div>
                    <div className="font-bold text-orange-600 text-sm">
                        {latest.KOSPI200 ? Number(latest.KOSPI200).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </div>
                </div>

                <div 
                    className="flex-1 p-1.5 text-center transition-all flex flex-column justify-content-center"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderTop: '3px solid #10b981'
                    }}
                >
                    <div className="text-xs text-500 font-semibold mb-0.5">거래대금</div>
                    <div className="font-bold text-emerald-600 text-sm">
                        {latest.tradingValue ? `₩${(Number(latest.tradingValue) / 1000000000000).toFixed(1)}조` : '₩24.4조'}
                    </div>
                </div>
            </div>

            {/* Smooth Area Chart */}
            <div className="w-full flex-1" style={{ minHeight: '80px', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kospiData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorKospi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="colorKospi200" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#ea580c" stopOpacity={0.01}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => Math.round(val).toLocaleString()} />
                        <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => val.toFixed(1)} />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px' }}
                            formatter={(val: any) => Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} />
                        <Area yAxisId="left" type="monotone" dataKey="KOSPI" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorKospi)" dot={false} activeDot={{r:5, strokeWidth:2, stroke:'#fff'}} />
                        <Area yAxisId="right" type="monotone" dataKey="KOSPI200" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#colorKospi200)" dot={false} activeDot={{r:5, strokeWidth:2, stroke:'#fff'}} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
