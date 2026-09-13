import os
import re

stats_content = """import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ProductStats = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error("Failed to load orders", err));
    }, []);

    const designCountMap: Record<string, number> = {};
    orders.forEach(o => {
        const design = o.design || '기타';
        designCountMap[design] = (designCountMap[design] || 0) + 1;
    });

    const chartData = Object.entries(designCountMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); 

    return (
        <div className="w-screen h-screen surface-100 flex flex-column overflow-hidden" style={{ fontFamily: 'Pretendard, sans-serif' }}>
            <div className="flex justify-content-between align-items-center px-4 py-3 surface-0 border-bottom-1 border-300 shadow-2">
                <div className="flex align-items-center gap-3">
                    <Button icon="pi pi-arrow-left" className="p-button-text p-button-secondary p-button-sm" onClick={() => navigate('/')} />
                    <h2 className="m-0 text-900 font-bold tracking-wide"><i className="pi pi-box mr-2 text-primary"></i>제품(디자인)별 주문 통계</h2>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex gap-4">
                <div className="surface-0 p-4 border-round shadow-1 flex-1 flex flex-column">
                    <h3 className="m-0 mb-4 text-800">🔥 인기 디자인 TOP 10</h3>
                    <div className="flex-1 w-full" style={{ minHeight: '400px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#4b5563'}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Bar dataKey="count" fill="#8b5cf6" name="누적 주문 건수" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="surface-0 p-4 border-round shadow-1 flex-1 flex flex-column">
                    <h3 className="m-0 mb-4 text-800">📋 제품별 상세 데이터</h3>
                    <DataTable value={chartData} size="small" paginator rows={15} emptyMessage="데이터가 없습니다.">
                        <Column field="name" header="디자인 (제품명)" sortable></Column>
                        <Column field="count" header="총 주문 건수" sortable body={(r) => <span className="font-bold text-primary">{r.count} 건</span>}></Column>
                    </DataTable>
                </div>
            </div>
        </div>
    );
};
"""

with open('frontend/src/pages/ProductStats.tsx', 'w', encoding='utf-8') as f:
    f.write(stats_content)


with open('frontend/src/main.tsx', 'r', encoding='utf-8') as f:
    main_content = f.read()

main_content = main_content.replace("import { OAuth2RedirectHandler } from './pages/OAuth2RedirectHandler'", 
                                  "import { OAuth2RedirectHandler } from './pages/OAuth2RedirectHandler'\nimport { ProductStats } from './pages/ProductStats'")

main_content = main_content.replace('<Route path="/*" element={<App />} />', 
                                  '<Route path="/stats" element={<ProductStats />} />\n          <Route path="/*" element={<App />} />')

with open('frontend/src/main.tsx', 'w', encoding='utf-8') as f:
    f.write(main_content)


with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

if 'useNavigate' not in app_content:
    app_content = app_content.replace("import React,", "import { useNavigate } from 'react-router-dom';\nimport React,")
    app_content = re.sub(r'(function App\(\) \{)', r'\1\n    const navigate = useNavigate();', app_content)

button_code = """<Button label="제품별 통계" icon="pi pi-chart-bar" className="p-button-outlined p-button-secondary p-button-sm" onClick={() => navigate('/stats')} />
                    <Button label="새 주문" """

app_content = app_content.replace('<Button label="새 주문" ', button_code)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)

print("Created ProductStats page and wired it up")
