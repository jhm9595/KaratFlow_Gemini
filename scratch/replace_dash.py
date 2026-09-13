import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will replace the <Card title={t('active_orders')}>... and <Card title={t('pipeline')}> completely.
# with the Recharts structure.

replacement = """                    <div className="surface-0 p-3 border-round shadow-1 mb-3">
                        <h4 className="m-0 mb-3 text-600 font-medium">실시간 공정 흐름 및 바틀넥</h4>
                        <div className="flex justify-content-between align-items-center px-5 py-4 relative">
                            {/* Connecting Line */}
                            <div className="absolute border-top-2 border-300 z-0" style={{ top: '50%', left: '4rem', right: '4rem', transform: 'translateY(-50%)' }}></div>
                            
                            {stageCounts.map((s, i) => {
                                const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                    '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                    'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                    '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                    '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                    '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                };
                                const color = stageColors[s.name] || stageColors['접수'];
                                
                                return (
                                    <div key={s.name} className="flex flex-column align-items-center z-1 relative bg-white" style={{ borderRadius: '50%' }}>
                                        <div className={`flex align-items-center justify-content-center border-circle border-2 ${color.bg} ${color.border} mb-2 shadow-1`} style={{ width: '60px', height: '60px' }}>
                                            <span className={`text-2xl font-bold ${color.text}`}>{s.count}</span>
                                        </div>
                                        <span className="text-700 font-medium bg-white px-2">{s.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column overflow-hidden">
                        <h4 className="m-0 mb-3 text-600 font-medium">상세 주문 모니터링</h4>
                        <div className="flex-1 overflow-auto custom-dark-table pb-3">
                            {/* @ts-ignore */}
                            <DataTable value={orders} size="small" paginator rows={10} selectionMode="single" selection={selectedOrderId === null ? null : orders.find(o => o.id === selectedOrderId)} onSelectionChange={(e) => { setSelectedOrderId(e.value?.id); if(e.value) setOrderDetailVisible(true); }} dataKey="id" emptyMessage="등록된 주문이 없습니다." className="p-datatable-sm cursor-pointer" rowClassName={() => 'surface-0 text-900 hover:surface-50 transition-colors transition-duration-200'}>
                                <Column header="주문 번호" body={(r) => <span className="font-bold text-primary">#{r.orderNo || r.id}</span>} style={{ minWidth: '120px' }} />
                                <Column field="design" header="Design" />
                                <Column field="customerName" header="고객명" />
                                <Column field="stage" header="공정 상태" body={statusBodyTemplate}></Column>
                                <Column header="" body={(rowData) => <Button icon="pi pi-eye" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(rowData.id); setOrderDetailVisible(true); }} className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions={{position: 'left'}} />} style={{ width: '60px' }} />
                            </DataTable>
                        </div>
                    </div>"""

text = re.sub(r'\{/\* @ts-ignore \*/\}\s*<Card title=\{t\(\'active_orders\'\)\}>.*?</Card>\s*</div>\s*<div className="col-12 md:col-4">\s*\{/\* @ts-ignore \*/\}\s*<Card title=\{t\(\'pipeline\'\)\}>.*?</Card>\s*</div>', replacement, text, flags=re.DOTALL)


# Also add Recharts import at the top
if 'RechartsTooltip' not in text:
    text = text.replace("import i18n from './i18n';", "import i18n from './i18n';\nimport { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';\nimport { Badge } from 'primereact/badge';")


# And replace the dashboardStats part (left panel)
left_panel_replacement = """                {/* Left Panel: Metrics & Charts */}
                <div className="flex flex-column gap-3" style={{ width: '450px' }}>
                    <div className="surface-0 p-3 border-round shadow-1">
                        <h4 className="m-0 mb-3 text-600 font-medium">실시간 주요 지표</h4>
                        <div className="grid">
                            <div className="col-6">
                                <div className="surface-50 p-3 border-round text-center">
                                    <span className="block text-500 font-medium mb-2">오늘 신규 주문</span>
                                    <div className="text-900 font-bold text-3xl">24<span className="text-sm text-green-500 ml-2"><i className="pi pi-arrow-up"></i> 12%</span></div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="surface-50 p-3 border-round text-center">
                                    <span className="block text-500 font-medium mb-2">공정 지연(병목)</span>
                                    <div className="text-900 font-bold text-3xl text-orange-500">3<span className="text-sm text-500 ml-2">건</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                        <h4 className="m-0 mb-2 text-600 font-medium">주간 공정 트렌드</h4>
                        <div className="flex-1" style={{ minHeight: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[
                                    { date: '08/17', CAD: 2.1, 주물: 4.5, 세공: 8.2 },
                                    { date: '08/18', CAD: 2.4, 주물: 4.2, 세공: 9.1 },
                                    { date: '08/19', CAD: 1.8, 주물: 5.0, 세공: 12.5 },
                                    { date: '08/20', CAD: 2.5, 주물: 4.1, 세공: 10.8 },
                                    { date: '08/21', CAD: 2.0, 주물: 4.8, 세공: 8.5 },
                                    { date: '08/22', CAD: 2.2, 주물: 4.4, 세공: 8.0 },
                                    { date: '08/23', CAD: 1.9, 주물: 4.0, 세공: 7.5 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6c757d' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6c757d' }} dx={-10} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="CAD" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="주물" stroke="#F97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="세공" stroke="#EC4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>"""

text = re.sub(r'\{\/\* Left Panel.*?<div className="col-12 md:col-8 flex flex-column gap-3">', left_panel_replacement + '\n                <div className="col-12 md:col-8 flex flex-column gap-3">', text, flags=re.DOTALL)


# Fix the unused variables
text = re.sub(r'const dashboardStats = [^;]+;', '', text)

# Fix stage map
text = text.replace("const stageMap: Record<string, string> = { PENDING: '?묒닔', CAD: 'CAD', CASTING: '二쇰Ъ', POLISHING: '?멸났', PLATING: '꾧툑', INSPECTION: '寃€', COMPLETED: '?꾩꽦' };", "const stageMap: Record<string, string> = { PENDING: '접수', CAD: 'CAD', CASTING: '주물', POLISHING: '세공', PLATING: '도금', INSPECTION: '검수', COMPLETED: '완성' };")
text = text.replace("if (s === 'PENDING') s = '?묒닔';", "if (s === 'PENDING') s = '접수';")
text = text.replace("else if (s === 'POLISHING' || s === '?멸났') s = '?멸났';", "else if (s === 'POLISHING' || s === '세공') s = '세공';")
text = text.replace("else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '?꾩꽦';", "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '완성';")
text = text.replace("else s = '?묒닔';", "else s = '접수';")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Dashboard replaced.")
