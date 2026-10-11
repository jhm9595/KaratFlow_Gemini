import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export const PetroleumChart: React.FC = () => {
    const [petroleumData, setPetroleumData] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const petRes = await fetch('http://localhost:8888/api/global-metrics/petroleum/history');
                if (petRes.ok) {
                    const petData = await petRes.json();
                    setPetroleumData(petData.map((d: any) => ({
                        date: d.date ? `${String(new Date(d.date).getMonth() + 1).padStart(2, '0')}/${String(new Date(d.date).getDate()).padStart(2, '0')}` : d.date,
                        휘발유: d.gasolinePrice,
                        경유: d.dieselPrice,
                        실내등유: d.kerosenePrice,
                        rawDate: d.date
                    })));
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchHistory();
    }, []);

    const latest = petroleumData.length > 0 ? petroleumData[petroleumData.length - 1] : {};

    return (
        <div className="surface-0 p-3 border-round-xl shadow-1 flex flex-column justify-content-between h-full flex-1" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)', minHeight: '0' }}>
            {/* Header with red fuel icon badge */}
            <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 border-100">
                <div className="flex align-items-center gap-2">
                    <div className="flex align-items-center justify-content-center border-circle" style={{ width: '28px', height: '28px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                        <i className="pi pi-bolt text-sm font-bold" />
                    </div>
                    <h4 className="m-0 text-800 font-bold text-base flex align-items-center gap-1">국내 석유 시세 <span className="text-xs text-500 font-normal ml-1">(1L 기준)</span></h4>
                </div>
            </div>

            {/* Top KPI Cards with color top accent borders */}
            <div className="flex gap-2 mb-2">
                <div 
                    className="flex-1 p-1.5 text-center transition-all flex flex-column justify-content-center"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderTop: '3px solid #ef4444'
                    }}
                >
                    <div className="text-xs text-500 font-semibold mb-0.5">휘발유</div>
                    <div className="font-bold text-red-600 text-sm">
                        {latest.휘발유 ? `₩${Number(latest.휘발유).toLocaleString()}` : '-'}
                    </div>
                </div>

                <div 
                    className="flex-1 p-1.5 text-center transition-all flex flex-column justify-content-center"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderTop: '3px solid #3b82f6'
                    }}
                >
                    <div className="text-xs text-500 font-semibold mb-0.5">경유</div>
                    <div className="font-bold text-blue-600 text-sm">
                        {latest.경유 ? `₩${Number(latest.경유).toLocaleString()}` : '-'}
                    </div>
                </div>

                <div 
                    className="flex-1 p-1.5 text-center transition-all flex flex-column justify-content-center"
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderTop: '3px solid #64748b'
                    }}
                >
                    <div className="text-xs text-500 font-semibold mb-0.5">등유</div>
                    <div className="font-bold text-slate-700 text-sm">
                        {latest.실내등유 ? `₩${Number(latest.실내등유).toLocaleString()}` : '-'}
                    </div>
                </div>
            </div>

            {/* Smooth Area Chart */}
            <div className="w-full flex-1" style={{ minHeight: '80px', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={petroleumData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGasoline" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="colorKerosene" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#64748b" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#64748b" stopOpacity={0.01}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis domain={[1300, 1820]} tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => val.toLocaleString()} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '11px' }} formatter={(val: any) => `₩${Number(val).toLocaleString()}`} />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} />
                        <Area type="monotone" dataKey="휘발유" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGasoline)" dot={false} activeDot={{r:5, strokeWidth:2, stroke:'#fff'}} />
                        <Area type="monotone" dataKey="경유" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDiesel)" dot={false} activeDot={{r:5, strokeWidth:2, stroke:'#fff'}} />
                        <Area type="monotone" dataKey="실내등유" name="등유" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#colorKerosene)" dot={false} activeDot={{r:5, strokeWidth:2, stroke:'#fff'}} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
