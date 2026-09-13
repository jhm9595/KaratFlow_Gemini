import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add orderDetailVisible state
if "const [orderDetailVisible, setOrderDetailVisible] = useState(false);" not in text:
    text = text.replace("const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);", "const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);\n    const [orderDetailVisible, setOrderDetailVisible] = useState(false);")

# 2. Add the Dialog at the end (before {/* Print Views */})
dialog_content = """
            <Dialog header="주문 상세 정보" visible={orderDetailVisible} style={{ width: '40vw' }} onHide={() => setOrderDetailVisible(false)}>
                {selectedOrderId && orders.find(o => o.id === selectedOrderId) && (
                    (() => {
                        const rowData = orders.find(o => o.id === selectedOrderId);
                        return (
                            <div className="flex flex-column gap-4">
                                <div className="surface-50 p-3 border-round">
                                    <h3 className="m-0 mb-3 text-800">기본 정보</h3>
                                    <div className="grid">
                                        <div className="col-6 mb-2"><span className="text-500">주문 번호:</span> <span className="font-bold">#{rowData.orderNo || rowData.id}</span></div>
                                        <div className="col-6 mb-2"><span className="text-500">고객명:</span> <span className="font-bold">{rowData.customerName}</span></div>
                                        <div className="col-6 mb-2"><span className="text-500">디자인:</span> <span className="font-bold">{rowData.design}</span></div>
                                        <div className="col-6 mb-2"><span className="text-500">현재 공정:</span> <span className="font-bold">{rowData.stage}</span></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="m-0 mb-3 text-800">작업 메뉴</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Button label="공정 진행" icon="pi pi-forward" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-success" />
                                        <Button label="외주 추적" icon="pi pi-truck" onClick={() => { setOrderDetailVisible(false); openSubcontractModal(rowData.id); }} className="p-button-secondary" />
                                        <Button label="라벨 인쇄" icon="pi pi-print" onClick={() => handlePrint(rowData, 'label')} className="p-button-outlined p-button-success" />
                                        <Button label="명세서 인쇄" icon="pi pi-file-pdf" onClick={() => handlePrint(rowData, 'invoice')} className="p-button-outlined p-button-info" />
                                        <Button label="변경 요청" icon="pi pi-pencil" onClick={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }} className="p-button-outlined p-button-warning" />
                                        <Button label="주문 취소" icon="pi pi-trash" onClick={() => { setOrderDetailVisible(false); openCancelModal(rowData.id); }} className="p-button-outlined p-button-danger" />
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                )}
            </Dialog>
"""

# Insert before {/* Print Views */}
text = text.replace("{/* Print Views (Outside of no-print container) */}", dialog_content + "\n            {/* Print Views (Outside of no-print container) */}")


with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Detail dialog injected!")
