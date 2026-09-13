import codecs
import re

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

state_injection = """    const [orderDetailVisible, setOrderDetailVisible] = useState(false);
    const [orderDetailData, setOrderDetailData] = useState<any>(null);

    const openOrderDetail = (orderId: number) => {
        setSelectedOrderId(orderId);
        fetch(`http://localhost:8888/api/orders/${orderId}/details`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setOrderDetailData(data);
                setOrderDetailVisible(true);
            })
            .catch(err => {
                console.error('Failed to fetch details', err);
                setOrderDetailVisible(true);
            });
    };"""

text = text.replace('const [orderDetailVisible, setOrderDetailVisible] = useState(false);', state_injection)

text = text.replace('if(e.value) setOrderDetailVisible(true);', 'if(e.value) openOrderDetail(e.value.id);')
text = text.replace('setOrderDetailVisible(true);', 'openOrderDetail(rowData.id);', 1) # Only replace the button click one

# The Dialog start:
#             <Dialog header={
#                 selectedOrderId && orders.find(o => o.id === selectedOrderId) ? (
# ...
#                     })()
#                 )}
#             </Dialog>

old_dialog_pattern = r'            <Dialog header=\{\s*selectedOrderId && orders.find\(o => o.id === selectedOrderId\).*?<\/Dialog>'

new_dialog = """            <Dialog header={
                selectedOrderId && orders.find(o => o.id === selectedOrderId) ? (
                    <div className="flex justify-content-between align-items-center w-full" style={{ paddingRight: '2rem' }}>
                        <span>주문 상세 정보</span>
                        <div className="flex gap-2">
                            <Button icon="pi pi-print" tooltip="라벨 인쇄" tooltipOptions={{ position: 'bottom' }} onClick={() => handlePrint(orders.find(o => o.id === selectedOrderId), 'label')} className="p-button-rounded p-button-text p-button-success p-button-sm" />
                            <Button icon="pi pi-file-pdf" tooltip="명세서 인쇄" tooltipOptions={{ position: 'bottom' }} onClick={() => handlePrint(orders.find(o => o.id === selectedOrderId), 'invoice')} className="p-button-rounded p-button-text p-button-info p-button-sm" />
                        </div>
                    </div>
                ) : "주문 상세 정보"
            } visible={orderDetailVisible} style={{ width: '70vw' }} onHide={() => setOrderDetailVisible(false)}>
                {selectedOrderId && orders.find(o => o.id === selectedOrderId) && (
                    (() => {
                        const rowData = orders.find(o => o.id === selectedOrderId);
                        
                        return (
                            <div className="flex flex-column gap-4">
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        <div className="surface-100 p-4 border-round flex flex-column gap-2 text-gray-800 h-full">
                                            <h3 className="m-0 mb-2">기본 정보</h3>
                                            <div className="flex justify-content-between"><span className="text-600">주문 번호</span> <span className="font-bold">{rowData.orderNo}</span></div>
                                            <div className="flex justify-content-between"><span className="text-600">고객명</span> <span className="font-bold">{rowData.customerName}</span></div>
                                            <div className="flex justify-content-between"><span className="text-600">표면 마감</span> <span className="font-bold">{rowData.surfaceFinish || '-'}</span></div>
                                            <div className="flex justify-content-between"><span className="text-600">각인 내용</span> <span className="font-bold">{rowData.engravingText || '-'} ({rowData.engravingLocation})</span></div>
                                            <div className="flex justify-content-between mt-3 border-top-1 border-300 pt-3"><span className="text-600">주문 상태 (대표)</span> <span>{statusBodyTemplate(rowData)}</span></div>
                                        </div>
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <div className="surface-100 p-4 border-round flex flex-column gap-2 text-gray-800 h-full">
                                            <h3 className="m-0 mb-2">제품 정보</h3>
                                            {orderDetailData ? (
                                                <>
                                                    <div className="flex justify-content-between"><span className="text-600">브랜드</span> <span className="font-bold">{orderDetailData.brand || '-'}</span></div>
                                                    <div className="flex justify-content-between"><span className="text-600">제품명</span> <span className="font-bold">{orderDetailData.productName || '-'}</span></div>
                                                    <div className="flex justify-content-between"><span className="text-600">디자인 코드</span> <span className="font-bold">{orderDetailData.designCode || '-'}</span></div>
                                                    <div className="flex justify-content-between"><span className="text-600">총 수량</span> <span className="font-bold">{orderDetailData.quantity}개</span></div>
                                                    {orderDetailData.imageUrl && (
                                                        <div className="mt-2 text-center">
                                                            <img src={`http://localhost:8888${orderDetailData.imageUrl}`} alt="제품 이미지" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}} />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-500">정보를 불러오는 중...</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="surface-100 p-4 border-round flex flex-column gap-2 mt-2">
                                    <h3 className="m-0 mb-3 text-800">공정 진행 타임라인 (대표 공정)</h3>
                                    {getTimelineEvents(rowData).length > 0 ? (
                                        <div className="overflow-x-auto w-full">
                                            <Timeline value={getTimelineEvents(rowData)} layout="horizontal" align="top" className="customized-timeline min-w-max" marker={customizedMarker} content={customizedContent} />
                                        </div>
                                    ) : (
                                        <div className="text-500">진행된 공정이 없습니다.</div>
                                    )}
                                </div>
                                
                                <div className="surface-100 p-4 border-round flex flex-column gap-2 mt-2">
                                    <h3 className="m-0 mb-3 text-800">개별 물건 트래킹 (총 {orderDetailData?.workOrders?.length || 0}개)</h3>
                                    {orderDetailData && orderDetailData.workOrders ? (
                                        <DataTable value={orderDetailData.workOrders} size="small" stripedRows responsiveLayout="scroll">
                                            <Column field="id" header="바코드 / W.O." body={(r: any) => <span className="font-bold text-primary">#{r.id}</span>}></Column>
                                            <Column field="stage" header="공정 상태" body={(r: any) => <span className={`px-2 py-1 border-round text-sm font-bold ${r.stage === '접수' || r.stage === 'PENDING' ? 'bg-indigo-100 text-indigo-700' : (r.stage === 'CAD' ? 'bg-blue-100 text-blue-700' : (r.stage === 'Casting' || r.stage === '주물' ? 'bg-orange-100 text-orange-700' : (r.stage === 'Polishing' || r.stage === '세공' ? 'bg-yellow-100 text-yellow-700' : (r.stage === 'Plating/Inspection' || r.stage === '도금' || r.stage === '검수' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'))))}`}>{r.stage}</span>}></Column>
                                            <Column field="createdAt" header="생성일자" body={(r: any) => r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}></Column>
                                        </DataTable>
                                    ) : (
                                        <div className="text-500">물건 목록을 불러오는 중...</div>
                                    )}
                                </div>
                                
                                <div className="mt-2">
                                    <h3 className="m-0 mb-3 text-800">작업 메뉴</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Button label="전체 공정 진행" icon="pi pi-forward" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-success" />
                                        <Button label="외주 처리" icon="pi pi-truck" onClick={() => { setOrderDetailVisible(false); openSubcontractModal(rowData.id); }} className="p-button-secondary" />

                                        <Button label="변경 요청" icon="pi pi-pencil" onClick={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }} className="p-button-outlined p-button-warning" />
                                        <Button label="주문 취소" icon="pi pi-trash" onClick={() => { setOrderDetailVisible(false); openCancelModal(rowData.id); }} className="p-button-outlined p-button-danger" />
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                )}
            </Dialog>"""

text = re.sub(old_dialog_pattern, new_dialog, text, flags=re.DOTALL)

text = text.replace("'PENDING': 'bg-indigo-100 text-indigo-700'", "'PENDING': 'bg-indigo-100 text-indigo-700',\n        '접수': 'bg-indigo-100 text-indigo-700'")

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)
