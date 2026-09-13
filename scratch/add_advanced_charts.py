import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
new_imports = "import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';"
content = re.sub(r"import \{ PieChart.*?\} from 'recharts';", new_imports, content)

# 2. Add mock data inside App function before return
mock_data_code = """
    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 주물: 4.5, 세공: 8.2 },
        { date: '08/18', CAD: 2.4, 주물: 4.2, 세공: 9.1 },
        { date: '08/19', CAD: 1.8, 주물: 5.0, 세공: 12.5 }, // 병목 발생
        { date: '08/20', CAD: 2.5, 주물: 4.1, 세공: 10.8 },
        { date: '08/21', CAD: 2.0, 주물: 4.8, 세공: 8.5 },
        { date: '08/22', CAD: 2.2, 주물: 4.4, 세공: 8.0 },
        { date: '08/23', CAD: 1.9, 주물: 4.0, 세공: 7.5 },
    ];

    const dailySubcontractData = [
        { date: '08/17', 제일도금: 24, 성실공방: 28 },
        { date: '08/18', 제일도금: 22, 성실공방: 30 },
        { date: '08/19', 제일도금: 25, 성실공방: 35 },
        { date: '08/20', 제일도금: 24, 성실공방: 25 },
        { date: '08/21', 제일도금: 21, 성실공방: 26 },
        { date: '08/22', 제일도금: 20, 성실공방: 28 },
        { date: '08/23', 제일도금: 22, 성실공방: 24 },
    ];
"""

content = content.replace("    return (", mock_data_code + "\n    return (")

old_left_panel = """{/* Left Panel: Metrics & Charts */}
                <div className="flex flex-column gap-3" style={{ width: '320px' }}>"""

new_left_panel = """{/* Left Panel: Metrics & Charts */}
                <div className="flex flex-column gap-3" style={{ width: '450px' }}>"""

content = content.replace(old_left_panel, new_left_panel)

old_pie_block_regex = r'<div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">\s*<h4 className="m-0 mb-3 text-600 font-medium">B2B / B2C 비율</h4>.*?</div>\s*</div>'

new_charts_block = """
                    {/* Advanced Chart 1: 병목 분석 */}
                    <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                        <h4 className="m-0 mb-3 text-600 font-medium">일자별 공정 리드타임 (시간)</h4>
                        <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyProcessData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="CAD" stackId="a" fill="#8884d8" name="CAD" />
                                    <Bar dataKey="주물" stackId="a" fill="#82ca9d" name="주물" />
                                    <Bar dataKey="세공" stackId="a" fill="#ffc658" name="세공" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Advanced Chart 2: 외주 리드타임 */}
                    <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                        <h4 className="m-0 mb-3 text-600 font-medium">외주 업체별 소요시간 추이 (시간)</h4>
                        <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailySubcontractData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="제일도금" stroke="#8884d8" strokeWidth={3} dot={{r: 4}} />
                                    <Line type="monotone" dataKey="성실공방" stroke="#82ca9d" strokeWidth={3} dot={{r: 4}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>"""

content = re.sub(old_pie_block_regex, new_charts_block.replace('\\', '\\\\'), content, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added advanced charts")
