import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will replace the ENTIRE rendering block of the dashboard (header + grid).

start_marker = r'            <div className="p-m-4 p-4 no-print">\s*<Toast ref=\{toast\} />\s*<div className="flex justify-content-between align-items-center mb-4">.*?</div>\s*</div>\s*<div className="grid">.*?</div>\s*</div>'

apm_dashboard = """            <Toast ref={toast} />
            <div className="flex flex-column h-screen surface-ground no-print">
                {/* APM Header */}
                <div className="flex justify-content-between align-items-center px-4 py-3 surface-0 border-bottom-1 border-300 shadow-2">
                    <div className="flex align-items-center gap-3">
                        <div className="w-2rem h-2rem bg-primary border-circle flex align-items-center justify-content-center shadow-1">
                            <i className="pi pi-chart-line text-white"></i>
                        </div>
                        <h2 className="m-0 text-xl font-bold text-900 tracking-tight">KaratFlow Gemini <span className="text-500 font-normal text-lg ml-2">통합 모니터링 대시보드</span></h2>
                    </div>
                    <div className="flex gap-2">
                        <Button label="새 주문 생성" icon="pi pi-plus" className="p-button-primary p-button-sm shadow-1" onClick={() => setCreateOrderModalVisible(true)} />
                        <Button label={t('lang')} icon="pi pi-globe" className="p-button-text p-button-secondary p-button-sm text-700" onClick={toggleLanguage} />
                        <Button label="협력사 초대" icon="pi pi-users" className="p-button-outlined p-button-info p-button-sm" onClick={openHandshakeModal} />
                        <Button label="보류 알림 시뮬레이션" icon="pi pi-bell" className="p-button-warning p-button-sm shadow-1" onClick={showHoldAlert} />
                        
                        <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                            <div className="w-2rem h-2rem border-circle bg-primary flex align-items-center justify-content-center text-white font-bold text-sm">
                                <i className="pi pi-user"></i>
                            </div>
                            <span className="text-700 font-bold text-sm">로그인됨</span>
                            <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger ml-2" aria-label="Logout" tooltip="로그아웃" tooltipOptions={{position: 'bottom'}} onClick={() => { localStorage.removeItem('jwtToken'); window.location.href = '/login'; }} />
                        </div>
                    </div>
                </div>

                {/* APM Main Content */}
                <div className="flex-1 flex overflow-hidden p-3 gap-3">
                    {/* Left Panel: Metrics & Charts */}
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
                    </div>

                    {/* Right Panel: Pipeline & Data Table */}
                    <div className="flex-1 flex flex-column gap-3 overflow-hidden">
                        
                        {/* Pipeline Visualizer */}
                        <div className="surface-0 p-3 border-round shadow-1">
                            <h4 className="m-0 mb-3 text-600 font-medium">실시간 공정 흐름 및 바틀넥</h4>
                            <div className="flex justify-content-between align-items-center px-5 py-4 relative">
                                {/* Connecting Line */}
                                <div className="absolute border-top-2 border-300" style={{ top: '35px', left: '4rem', right: '4rem', zIndex: 0 }}></div>
                                
                                {[{name: '접수', count: orders.filter(o => o.stage==='PENDING').length}, {name: 'CAD', count: orders.filter(o => o.stage==='CAD').length}, {name: '주물', count: orders.filter(o => o.stage==='CASTING').length}, {name: '세공', count: orders.filter(o => o.stage==='POLISHING').length}, {name: '완성', count: orders.filter(o => o.stage==='COMPLETED').length}].map((s, i) => {
                                    const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                        '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                        'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                        '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                        '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                        '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                    };
                                    const color = stageColors[s.name] || stageColors['접수'];
                                    
                                    return (
                                        <div key={s.name} className="flex flex-column align-items-center relative" style={{ zIndex: 1 }}>
                                            <div className={`flex align-items-center justify-content-center border-circle border-2 ${color.bg} ${color.border} mb-2 shadow-1 bg-white`} style={{ width: '70px', height: '70px' }}>
                                                <span className={`text-2xl font-bold ${color.text}`}>{s.count}</span>
                                            </div>
                                            <span className="text-700 font-medium bg-white px-2">{s.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Enhanced Data Table */}
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
                        </div>
                    </div>
                </div>
            </div>"""

text = re.sub(start_marker, apm_dashboard, text, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Dashboard and layout definitively replaced via regex!")
