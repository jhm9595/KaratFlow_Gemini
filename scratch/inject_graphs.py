import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Ensure BarChart is imported
if "BarChart," not in text:
    text = text.replace("LineChart, Line", "BarChart, Bar, LineChart, Line")

# 2. Add the data constants before return
data_constants = """
    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 주물: 4.5, 세공: 8.2 },
        { date: '08/18', CAD: 2.4, 주물: 4.2, 세공: 9.1 },
        { date: '08/19', CAD: 1.8, 주물: 5.0, 세공: 12.5 }, 
        { date: '08/20', CAD: 2.5, 주물: 4.1, 세공: 10.8 },
        { date: '08/21', CAD: 2.0, 주물: 4.8, 세공: 8.5 },
        { date: '08/22', CAD: 2.2, 주물: 4.4, 세공: 8.0 },
        { date: '08/23', CAD: 1.9, 주물: 4.0, 세공: 7.5 }
    ];
    
    const dailySubcontractData = [
        { date: '08/17', 제일도금: 24, 성실주물: 12 },
        { date: '08/18', 제일도금: 22, 성실주물: 14 },
        { date: '08/19', 제일도금: 28, 성실주물: 11 },
        { date: '08/20', 제일도금: 25, 성실주물: 16 },
        { date: '08/21', 제일도금: 20, 성실주물: 13 },
        { date: '08/22', 제일도금: 18, 성실주물: 10 },
        { date: '08/23', 제일도금: 21, 성실주물: 12 }
    ];
"""

if "const dailyProcessData" not in text:
    text = text.replace("return (", data_constants + "\n    return (")

# 3. Replace the left panel
left_panel_regex = r'\{\/\* Left Panel: Metrics & Charts \*\/\}.*?\{\/\* Right Panel: Pipeline & Data Table \*\/\}'

new_left_panel = """{/* Left Panel: Metrics & Charts */}
                    <div className="flex flex-column gap-3" style={{ width: '450px' }}>
                        <div className="surface-0 p-3 border-round shadow-1">
                            <h4 className="m-0 mb-3 text-600 font-medium">실시간 주요 지표</h4>
                            <div className="flex justify-content-between align-items-end mb-3">
                                <span className="text-600">진행중 주문</span>
                                <span className="text-3xl font-bold text-900">{orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'COMPLETED').length} <small className="text-sm font-normal text-gray-500">건</small></span>
                            </div>
                            <div className="flex justify-content-between align-items-end mb-3">
                                <span className="text-600">금일 완료</span>
                                <span className="text-3xl font-bold text-green-400">{orders.filter(o => o.status === 'COMPLETED').length} <small className="text-sm font-normal text-gray-500">건</small></span>
                            </div>
                        </div>
                        
                        
                        {/* Advanced Chart 1: 병목 분석 */}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                            <h4 className="m-0 mb-3 text-600 font-medium">작업장 공정 트렌드 현황 (주간)</h4>
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

                        {/* Advanced Chart 2: 외주 처리 현황 */}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                            <h4 className="m-0 mb-3 text-600 font-medium">외주 협력업체 처리 시간 추이 (주간)</h4>
                            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailySubcontractData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Line type="monotone" dataKey="제일도금" stroke="#8884d8" strokeWidth={3} dot={{r: 4}} />
                                        <Line type="monotone" dataKey="성실주물" stroke="#82ca9d" strokeWidth={3} dot={{r: 4}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Pipeline & Data Table */}"""

text = re.sub(left_panel_regex, new_left_panel, text, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Graphs restored properly!")
