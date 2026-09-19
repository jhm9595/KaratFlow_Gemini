import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProcessTrendChartProps {
    data: any[];
}

export const ProcessTrendChart: React.FC<ProcessTrendChartProps> = ({ data }) => {
    return (
        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
            <h4 className="m-0 mb-3 text-600 font-medium">작업장 공정 트렌드 현황 (주간)</h4>
            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="CAD" stackId="a" fill="#8884d8" name="CAD" />
                        <Bar dataKey="주물" stackId="a" fill="#82ca9d" name="주물" />
                        <Bar dataKey="세공" stackId="a" fill="#ffc658" name="세공" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
