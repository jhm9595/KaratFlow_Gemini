import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_imports = """
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Badge } from 'primereact/badge';
"""

content = content.replace("import i18n from './i18n';", "import i18n from './i18n';\n" + new_imports)

state_code = """
    const [liveEvents, setLiveEvents] = useState<{id: number, message: string, time: string}[]>([]);
"""
content = content.replace("const [orders, setOrders] = useState<any[]>([]);", "const [orders, setOrders] = useState<any[]>([]);\n" + state_code)

old_stomp = """toast.current?.show({ 
                            severity: 'error', 
                            summary: t('alert_title'), 
                            detail: payload.message || t('alert_desc'), 
                            life: 5000 
                        });
                        fetchOrders();"""
new_stomp = """toast.current?.show({ 
                            severity: 'info', 
                            summary: 'Live Event', 
                            detail: payload.message, 
                            life: 5000 
                        });
                        setLiveEvents(prev => [{
                            id: Date.now(), 
                            message: payload.message, 
                            time: new Date().toLocaleTimeString()
                        }, ...prev].slice(0, 50));
                        fetchOrders();"""
content = content.replace(old_stomp, new_stomp)

new_layout = """
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const pieData = [
        { name: 'B2B', value: orders.filter(o => o.orderType === 'B2B').length },
        { name: 'B2C', value: orders.filter(o => o.orderType === 'B2C').length }
    ];
    
    const stages = ['접수', 'CAD', '주물', '세공', '완성'];
    const stageCounts = stages.map(stage => ({
        name: stage,
        count: orders.filter(o => o.stage === stage).length
    }));

    return (
        <div className="w-screen h-screen surface-900 text-gray-100 flex flex-column overflow-hidden no-print" style={{ fontFamily: 'Pretendard, sans-serif' }}>
            <Toast ref={toast} />
            
            {/* APM Header */}
            <div className="flex justify-content-between align-items-center px-4 py-3 surface-800 border-bottom-1 border-gray-700 shadow-2">
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-chart-line text-primary" style={{ fontSize: '1.5rem' }}></i>
                    <h2 className="m-0 text-white font-bold tracking-wide">KaratFlow <span className="text-primary font-normal text-lg ml-2">APM Dashboard</span></h2>
                </div>
                <div className="flex gap-2">
                    <Button label="새 주문" icon="pi pi-plus" className="p-button-primary p-button-sm" onClick={() => setCreateOrderModalVisible(true)} />
                    <Button label="파트너" icon="pi pi-users" className="p-button-outlined p-button-info p-button-sm" onClick={openHandshakeModal} />
                    <Button label={t('lang')} icon="pi pi-globe" className="p-button-text p-button-secondary p-button-sm text-gray-300" onClick={toggleLanguage} />
                </div>
            </div>

            {/* APM Main Content */}
            <div className="flex-1 flex overflow-hidden p-3 gap-3">
                
                {/* Left Panel: Metrics & Charts */}
                <div className="flex flex-column gap-3" style={{ width: '320px' }}>
                    <div className="surface-800 p-3 border-round shadow-1">
                        <h4 className="m-0 mb-3 text-gray-400 font-medium">실시간 통합 지표</h4>
                        <div className="flex justify-content-between align-items-end mb-3">
                            <span className="text-gray-400">진행중 주문</span>
                            <span className="text-3xl font-bold text-white">{orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'COMPLETED').length} <small className="text-sm font-normal text-gray-500">건</small></span>
                        </div>
                        <div className="flex justify-content-between align-items-end mb-3">
                            <span className="text-gray-400">당일 완료</span>
                            <span className="text-3xl font-bold text-green-400">{orders.filter(o => o.status === 'COMPLETED').length} <small className="text-sm font-normal text-gray-500">건</small></span>
                        </div>
                    </div>
                    
                    <div className="surface-800 p-3 border-round shadow-1 flex-1 flex flex-column">
                        <h4 className="m-0 mb-3 text-gray-400 font-medium">B2B / B2C 비율</h4>
                        <div className="flex-1 w-full" style={{ minHeight: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-content-center gap-4 mt-2">
                            <div className="flex align-items-center gap-2"><span className="w-1rem h-1rem border-round" style={{backgroundColor: COLORS[0]}}></span><span className="text-sm">B2B</span></div>
                            <div className="flex align-items-center gap-2"><span className="w-1rem h-1rem border-round" style={{backgroundColor: COLORS[1]}}></span><span className="text-sm">B2C</span></div>
                        </div>
                    </div>
                </div>

                {/* Center Panel: Pipeline & Table */}
                <div className="flex-1 flex flex-column gap-3 overflow-hidden">
                    
                    {/* Pipeline Status */}
                    <div className="surface-800 p-4 border-round shadow-1">
                        <h4 className="m-0 mb-4 text-gray-400 font-medium">실시간 공정 현황 (Pipeline)</h4>
                        <div className="flex justify-content-between align-items-center px-4">
                            {stageCounts.map((s, i) => (
                                <div key={s.name} className="flex flex-column align-items-center relative w-full">
                                    <div className="z-1 flex align-items-center justify-content-center border-circle bg-gray-700 border-2 border-primary mb-2 shadow-2" style={{ width: '60px', height: '60px' }}>
                                        <span className="text-2xl font-bold text-white">{s.count}</span>
                                    </div>
                                    <span className="text-gray-300 font-medium">{s.name}</span>
                                    {i < stageCounts.length - 1 && (
                                        <div className="absolute top-50 left-50 w-full z-0" style={{ height: '4px', backgroundColor: '#374151', transform: 'translate(30px, -20px)' }}>
                                            <div className="h-full bg-primary" style={{ width: s.count > 0 ? '100%' : '0%', transition: 'width 0.5s' }}></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="surface-800 p-3 border-round shadow-1 flex-1 flex flex-column overflow-hidden">
                        <h4 className="m-0 mb-3 text-gray-400 font-medium">상세 주문 모니터링</h4>
                        <div className="flex-1 overflow-auto custom-dark-table pb-3">
                            {/* @ts-ignore */}
                            <DataTable value={orders} size="small" paginator rows={10} selectionMode="single" selection={selectedOrderId === null ? null : orders.find(o => o.id === selectedOrderId)} onSelectionChange={(e) => setSelectedOrderId(e.value?.id)} dataKey="id" emptyMessage="활성 주문이 없습니다." className="p-datatable-sm" rowClassName={() => 'bg-gray-800 text-white'}>
                                <Column field="orderNo" header="주문 번호" style={{ minWidth: '120px' }} />
                                <Column field="design" header="Design" />
                                <Column field="customerName" header="고객명" />
                                <Column header="표면/각인" body={(r) => (
                                    <div className="text-sm">
                                        <div>{r.surfaceFinish || '-'}</div>
                                        {r.engravingText && <div className="text-primary text-xs">{r.engravingText}</div>}
                                    </div>
                                )}></Column>
                                <Column field="stage" header="공정 상태" body={statusBodyTemplate}></Column>
                                <Column body={actionBodyTemplate} header="작업" style={{ minWidth: '200px' }} />
                            </DataTable>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Live Feed */}
                <div className="surface-800 p-3 border-round shadow-1 flex flex-column" style={{ width: '350px' }}>
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h4 className="m-0 text-gray-400 font-medium">Live Event Feed</h4>
                        <span className="flex align-items-center gap-2">
                            <span className="w-1rem h-1rem bg-green-500 border-circle inline-block" style={{ animation: 'pulse 2s infinite' }}></span>
                            <span className="text-sm text-green-500 font-bold">LIVE</span>
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {liveEvents.length === 0 ? (
                            <div className="text-center text-gray-500 py-4 mt-5">최근 발생한 이벤트가 없습니다.</div>
                        ) : (
                            liveEvents.map(ev => (
                                <div key={ev.id} className="surface-700 p-3 border-round border-left-3 border-primary shadow-1 fadein animation-duration-300">
                                    <div className="flex justify-content-between align-items-center mb-1">
                                        <span className="text-xs text-gray-400"><i className="pi pi-clock mr-1"></i> {ev.time}</span>
                                    </div>
                                    <div className="text-sm text-white line-height-3">{ev.message}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Modals and Print Views... (Preserving exactly from original) */}
"""

modals_match = re.search(r'(<Dialog header="새 주문 생성".*?)</>\s*\);\s*}\s*export default App;', content, re.DOTALL)
if modals_match:
    modals_code = modals_match.group(1)
    
    final_return = new_layout + "\n            {/* Original Modals */}\n            " + modals_code + "\n        </div>\n    );\n}\n\nexport default App;\n"
    content = re.sub(r'return \(\s*<>\s*<div className="p-m-4 p-4 no-print">.*?</>\s*\);\s*}\s*export default App;', final_return.replace('\\', '\\\\'), content, flags=re.DOTALL)
    
    with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully rewrote App.tsx")
else:
    print("Failed to find modals block!")
