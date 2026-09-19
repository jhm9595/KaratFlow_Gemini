import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TabView, TabPanel } from 'primereact/tabview';

export const PetroleumKospiChart: React.FC = () => {
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

    return (
        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
            <h4 className="m-0 mb-2 text-600 font-medium">글로벌 지표 트렌드</h4>
            <div className="flex-1 w-full">
                <TabView>
                    <TabPanel header="석유/에너지 (유가)">
                        <div style={{ height: '180px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={petroleumData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="휘발유" stroke="#ef4444" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                                    <Line type="monotone" dataKey="경유" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </TabPanel>
                    <TabPanel header="코스피 (KOSPI)">
                        <div style={{ height: '180px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={kospiData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="KOSPI" stroke="#f59e0b" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                                    <Line type="monotone" dataKey="KOSPI200" stroke="#8b5cf6" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </TabPanel>
                </TabView>
            </div>
        </div>
    );
};
