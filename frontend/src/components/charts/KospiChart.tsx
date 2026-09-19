import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const KospiChart: React.FC = () => {
    const [kospiData, setKospiData] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchHistory = async () => {
            try {
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
            <h4 className="m-0 mb-3 text-600 font-medium">코스피 지수 (KOSPI)</h4>
            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kospiData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip itemSorter={(item) => -Number(item.value || 0)} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="KOSPI" stroke="#f59e0b" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                        <Line yAxisId="right" type="monotone" dataKey="KOSPI200" stroke="#8b5cf6" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
