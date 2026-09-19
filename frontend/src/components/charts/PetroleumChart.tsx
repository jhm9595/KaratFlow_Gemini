import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const PetroleumChart: React.FC = () => {
    const [petroleumData, setPetroleumData] = useState<any[]>([]);
    
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
            } catch (err) {
                console.error(err);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
            <h4 className="m-0 mb-3 text-600 font-medium">석유 시세 (휘발유/경유)</h4>
            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={petroleumData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip itemSorter={(item) => -Number(item.value || 0)} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="휘발유" stroke="#ef4444" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                        <Line type="monotone" dataKey="경유" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
