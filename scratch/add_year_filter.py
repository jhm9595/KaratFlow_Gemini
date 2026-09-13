import re

with open('frontend/src/pages/ProductStats.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { Button } from 'primereact/button';", 
                          "import { Button } from 'primereact/button';\nimport { Dropdown } from 'primereact/dropdown';")

state_code = """
    const [selectedYear, setSelectedYear] = useState<string>('전체');
    const years = ['전체', '2026', '2025', '2024'];
"""
content = content.replace("const [orders, setOrders] = useState<any[]>([]);", 
                          "const [orders, setOrders] = useState<any[]>([]);\n" + state_code)

grouping_logic = """
    const designCountMap: Record<string, number> = {};
    orders.forEach(o => {
        // o.date format is typically YYYY-MM-DD
        const orderYear = o.date ? o.date.substring(0, 4) : '2026';
        if (selectedYear === '전체' || selectedYear === orderYear) {
            const design = o.design || '기타';
            designCountMap[design] = (designCountMap[design] || 0) + 1;
        }
    });
"""

old_grouping = """
    const designCountMap: Record<string, number> = {};
    orders.forEach(o => {
        const design = o.design || '기타';
        designCountMap[design] = (designCountMap[design] || 0) + 1;
    });
"""
content = content.replace(old_grouping.strip(), grouping_logic.strip())

header_ui = """
                <div className="flex align-items-center gap-3">
                    <Button icon="pi pi-arrow-left" className="p-button-text p-button-secondary p-button-sm" onClick={() => navigate('/')} />
                    <h2 className="m-0 text-900 font-bold tracking-wide"><i className="pi pi-box mr-2 text-primary"></i>제품(디자인)별 주문 통계</h2>
                </div>
                <div className="flex align-items-center gap-2">
                    <span className="text-700 font-medium">연도 필터:</span>
                    <Dropdown value={selectedYear} options={years} onChange={(e) => setSelectedYear(e.value)} className="w-9rem p-dropdown-sm" />
                </div>
"""

old_header_ui = """
                <div className="flex align-items-center gap-3">
                    <Button icon="pi pi-arrow-left" className="p-button-text p-button-secondary p-button-sm" onClick={() => navigate('/')} />
                    <h2 className="m-0 text-900 font-bold tracking-wide"><i className="pi pi-box mr-2 text-primary"></i>제품(디자인)별 주문 통계</h2>
                </div>
"""
content = content.replace(old_header_ui.strip(), header_ui.strip())


with open('frontend/src/pages/ProductStats.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Year Filter")
