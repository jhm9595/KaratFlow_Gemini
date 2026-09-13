import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. We need to add state for orderDetailVisible
state_code = """
    const [orderDetailVisible, setOrderDetailVisible] = useState(false);
"""
content = content.replace("const [liveEvents, setLiveEvents]", state_code + "    const [liveEvents, setLiveEvents]")

# The existing DataTable is:
old_table = """<DataTable value={orders} size="small" paginator rows={10} selectionMode="single" selection={selectedOrderId === null ? null : orders.find(o => o.id === selectedOrderId)} onSelectionChange={(e) => setSelectedOrderId(e.value?.id)} dataKey="id" emptyMessage="활성 주문이 없습니다." className="p-datatable-sm" rowClassName={() => 'bg-gray-800 text-white'}>
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
                            </DataTable>"""

new_table = """<DataTable value={orders} size="small" paginator rows={10} selectionMode="single" selection={selectedOrderId === null ? null : orders.find(o => o.id === selectedOrderId)} onSelectionChange={(e) => { setSelectedOrderId(e.value?.id); if(e.value) setOrderDetailVisible(true); }} dataKey="id" emptyMessage="활성 주문이 없습니다." className="p-datatable-sm cursor-pointer" rowClassName={() => 'bg-gray-800 text-white hover:surface-700 transition-colors transition-duration-200'}>
                                <Column field="orderNo" header="주문 번호" style={{ minWidth: '120px' }} />
                                <Column field="design" header="Design" />
                                <Column field="customerName" header="고객명" />
                                <Column field="stage" header="공정 상태" body={statusBodyTemplate}></Column>
                                <Column header="" body={() => <span className="text-500 text-sm"><i className="pi pi-external-link"></i> 상세 정보</span>} style={{ width: '100px' }} />
                            </DataTable>"""

content = content.replace(old_table, new_table)

# 4. Add the OrderDetailModal
# We'll inject it right before {/* Original Modals */}
detail_modal = """
            {/* @ts-ignore */}
            <Dialog header="주문 상세 정보" visible={orderDetailVisible} style={{ width: '40vw' }} onHide={() => setOrderDetailVisible(false)}>
                {selectedOrderId && orders.find(o => o.id === selectedOrderId) && (
                    (() => {
                        const rowData = orders.find(o => o.id === selectedOrderId);
                        return (
                            <div className="flex flex-column gap-4">
                                <div className="surface-100 p-4 border-round flex flex-column gap-2 text-gray-800">
                                    <h3 className="m-0 mb-2">기본 정보</h3>
                                    <div className="flex justify-content-between"><span className="text-600">주문 번호</span> <span className="font-bold">{rowData.orderNo}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">고객명</span> <span className="font-bold">{rowData.customerName}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">디자인</span> <span className="font-bold">{rowData.design}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">표면 마감</span> <span className="font-bold">{rowData.surfaceFinish || '-'}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">각인 내용</span> <span className="font-bold">{rowData.engravingText || '-'} ({rowData.engravingLocation})</span></div>
                                    <div className="flex justify-content-between mt-3 border-top-1 border-300 pt-3"><span className="text-600">현재 상태</span> <span>{statusBodyTemplate(rowData)}</span></div>
                                </div>
                                
                                <div>
                                    <h3 className="m-0 mb-3 text-white">작업 메뉴 (Actions)</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Button label="공정 이동" icon="pi pi-forward" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-success" />
                                        <Button label="외주 추적" icon="pi pi-truck" onClick={() => { setOrderDetailVisible(false); openSubcontractModal(rowData.id); }} className="p-button-secondary" />
                                        <Button label="라벨 인쇄" icon="pi pi-print" onClick={() => handlePrint(rowData, 'label')} className="p-button-outlined p-button-success" />
                                        <Button label="명세서 인쇄" icon="pi pi-file-pdf" onClick={() => handlePrint(rowData, 'invoice')} className="p-button-outlined p-button-info" />
                                        <Button label="변경 보류" icon="pi pi-pencil" onClick={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }} className="p-button-outlined p-button-warning" />
                                        <Button label="주문 취소" icon="pi pi-trash" onClick={() => { setOrderDetailVisible(false); openCancelModal(rowData.id); }} className="p-button-outlined p-button-danger" />
                                    </div>
                                </div>
                            </div>
                        )
                    })()
                )}
            </Dialog>
"""
content = content.replace("{/* Original Modals */}", detail_modal + "\n            {/* Original Modals */}")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated App.tsx to simplify grid")
