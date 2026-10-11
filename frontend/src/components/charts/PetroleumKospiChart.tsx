import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export const PetroleumKospiChart: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'petroleum' | 'kospi'>('petroleum');
    const [petroleumData, setPetroleumData] = useState<any[]>([]);
    const [kospiData, setKospiData] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const petRes = await fetch('http://localhost:8888/api/global-metrics/petroleum/history');
                if (petRes.ok) {
                    const petData = await petRes.json();
                    setPetroleumData(petData.map((d: any) => ({
                        date: new Date(d.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
                        휘발유: d.gasolinePrice,
                        경유: d.dieselPrice,
                        실내등유: d.kerosenePrice
                    })));
                }

                const kosRes = await fetch('http://localhost:8888/api/global-metrics/kospi/history');
                if (kosRes.ok) {
                    const kosData = await kosRes.json();
                    setKospiData(kosData.map((d: any) => ({
                        date: new Date(d.date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
                        KOSPI: d.kospiIndex,
                        KOSPI200: d.kospi200Index
                    })));
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchHistory();
    }, []);

    const latestPetroleum = petroleumData.length > 0 ? petroleumData[petroleumData.length - 1] : {};
    const latestKospi = kospiData.length > 0 ? kospiData[kospiData.length - 1] : {};

    return (
        <div className="surface-0 p-3 border-round-xl shadow-1 flex-1 flex flex-column" style={{ border: '1px solid #e2e8f0' }}>
            {/* Header with Title and Segmented Pill Switch */}
            <div className="flex justify-content-between align-items-center mb-2 pb-2 border-bottom-1 border-100">
                <div className="flex align-items-center gap-2">
                    <div className="flex align-items-center justify-content-center border-circle" style={{ width: '28px', height: '28px', backgroundColor: activeTab === 'petroleum' ? '#fee2e2' : '#e0e7ff', color: activeTab === 'petroleum' ? '#dc2626' : '#4f46e5' }}>
                        <i className={`pi ${activeTab === 'petroleum' ? 'pi-bolt' : 'pi-chart-line'} text-sm font-bold`} />
                    </div>
                    <h4 className="m-0 text-800 font-bold text-base">
                        {activeTab === 'petroleum' ? '석유 시세' : '코스피 지수'}
                        <span className="text-xs text-500 font-normal ml-1">(KRX)</span>
                    </h4>
                </div>

                {/* Pill Switch between Petroleum & Kospi */}
                <div 
                    className="flex align-items-center p-1 gap-1" 
                    style={{ 
                        backgroundColor: '#f1f5f9', 
                        borderRadius: '9999px',
                        border: '1px solid #e2e8f0' 
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setActiveTab('petroleum')}
                        className="border-none cursor-pointer flex align-items-center gap-1 transition-all transition-duration-200"
                        style={{
                            borderRadius: '9999px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: activeTab === 'petroleum' ? '#ef4444' : 'transparent',
                            color: activeTab === 'petroleum' ? '#ffffff' : '#64748b',
                            boxShadow: activeTab === 'petroleum' ? '0 2px 6px rgba(239, 68, 68, 0.35)' : 'none'
                        }}
                    >
                        <span>석유 시세</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('kospi')}
                        className="border-none cursor-pointer flex align-items-center gap-1 transition-all transition-duration-200"
                        style={{
                            borderRadius: '9999px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: activeTab === 'kospi' ? '#4f46e5' : 'transparent',
                            color: activeTab === 'kospi' ? '#ffffff' : '#64748b',
                            boxShadow: activeTab === 'kospi' ? '0 2px 6px rgba(79, 70, 229, 0.35)' : 'none'
                        }}
                    >
                        <span>코스피</span>
                    </button>
                </div>
            </div>

            {/* Top KPI Cards for Selected Metric */}
            {activeTab === 'petroleum' ? (
                <div className="flex gap-2 mb-2">
                    <div className="flex-1 p-1.5 text-center" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #ef4444' }}>
                        <div className="text-xs text-500 mb-0.5 font-semibold">휘발유</div>
                        <div className="font-bold text-red-600 text-base">{latestPetroleum.휘발유 ? `₩${Number(latestPetroleum.휘발유).toLocaleString()}` : '-'}</div>
                    </div>
                    <div className="flex-1 p-1.5 text-center" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #3b82f6' }}>
                        <div className="text-xs text-500 mb-0.5 font-semibold">경유</div>
                        <div className="font-bold text-blue-600 text-base">{latestPetroleum.경유 ? `₩${Number(latestPetroleum.경유).toLocaleString()}` : '-'}</div>
                    </div>
                    <div className="flex-1 p-1.5 text-center" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #64748b' }}>
                        <div className="text-xs text-500 mb-0.5 font-semibold">등유</div>
                        <div className="font-bold text-slate-700 text-base">{latestPetroleum.실내등유 ? `₩${Number(latestPetroleum.실내등유).toLocaleString()}` : '-'}</div>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2 mb-2">
                    <div className="flex-1 p-1.5 text-center" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #2563eb' }}>
                        <div className="text-xs text-500 mb-0.5 font-semibold">KOSPI 종합</div>
                        <div className="font-bold text-blue-600 text-base">{latestKospi.KOSPI ? Number(latestKospi.KOSPI).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</div>
                    </div>
                    <div className="flex-1 p-1.5 text-center" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '3px solid #ea580c' }}>
                        <div className="text-xs text-500 mb-0.5 font-semibold">KOSPI 200</div>
                        <div className="font-bold text-orange-600 text-base">{latestKospi.KOSPI200 ? Number(latestKospi.KOSPI200).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</div>
                    </div>
                </div>
            )}

            {/* Smooth Compact Area Chart */}
            <div className="flex-1 w-full" style={{ minHeight: '130px', height: '130px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'petroleum' ? (
                        <AreaChart data={petroleumData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorPetGasoline" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02}/>
                                </linearGradient>
                                <linearGradient id="colorPetDiesel" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                                </linearGradient>
                                <linearGradient id="colorPetKerosene" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.02}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="date" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                            <YAxis domain={['auto', 'auto']} tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }} formatter={(val: any) => `₩${Number(val).toLocaleString()}`} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Area type="monotone" dataKey="휘발유" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPetGasoline)" dot={{r:2.5, fill:'#ef4444'}} activeDot={{r:5}} />
                            <Area type="monotone" dataKey="경유" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPetDiesel)" dot={{r:2.5, fill:'#3b82f6'}} activeDot={{r:5}} />
                            <Area type="monotone" dataKey="실내등유" name="등유" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#colorPetKerosene)" dot={{r:2.5, fill:'#64748b'}} activeDot={{r:5}} />
                        </AreaChart>
                    ) : (
                        <AreaChart data={kospiData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorKospiMain" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02}/>
                                </linearGradient>
                                <linearGradient id="colorKospi200Main" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.02}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="date" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }} formatter={(val: any) => Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Area yAxisId="left" type="monotone" dataKey="KOSPI" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorKospiMain)" dot={{r:3, fill:'#2563eb'}} activeDot={{r:5}} />
                            <Area yAxisId="right" type="monotone" dataKey="KOSPI200" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorKospi200Main)" dot={{r:3, fill:'#ea580c'}} activeDot={{r:5}} />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};
