import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_modal = """                            <div className="flex flex-column gap-4">
                                <div className="surface-50 p-3 border-round">
                                    <h3 className="m-0 mb-3 text-800">기본 정보</h3>
                                    <div className="grid">
                                        <div className="col-6 mb-2"><span className="text-500">주문 번호:</span> <span className="font-bold">#{rowData.orderNo || rowData.id}</span></div>
                                        <div className="col-6 mb-2"><span className="text-500">고객명:</span> <span className="font-bold">{rowData.customerName}</span></div>
                                        <div className="col-6 mb-2"><span className="text-500">디자인:</span> <span className="font-bold">{rowData.design}</span></div>
                                        <div className="col-6 mb-2"><span className="text-500">현재 공정:</span> <span className="font-bold">{rowData.stage}</span></div>
                                    </div>
                                </div>"""

new_modal = """                            <div className="flex flex-column gap-4">
                                <div className="surface-100 p-4 border-round flex flex-column gap-2 text-gray-800">
                                    <h3 className="m-0 mb-2">기본 정보</h3>
                                    <div className="flex justify-content-between"><span className="text-600">주문 번호</span> <span className="font-bold">{rowData.orderNo}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">고객명</span> <span className="font-bold">{rowData.customerName}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">디자인</span> <span className="font-bold">{rowData.design}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">표면 마감</span> <span className="font-bold">{rowData.surfaceFinish || '-'}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">각인 내용</span> <span className="font-bold">{rowData.engravingText || '-'} ({rowData.engravingLocation})</span></div>
                                    <div className="flex justify-content-between mt-3 border-top-1 border-300 pt-3"><span className="text-600">현재 상태</span> <span>{statusBodyTemplate(rowData)}</span></div>
                                </div>"""

text = text.replace(old_modal, new_modal)

# Also fix the button labels for Actions which I might have slightly altered!
# Original Patch had:
# <Button label="공정 진행" icon="pi pi-forward" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-success" />
# <Button label="외주 처리" icon="pi pi-truck" onClick={() => { setOrderDetailVisible(false); openSubcontractModal(rowData.id); }} className="p-button-secondary" />
# <Button label="라벨 인쇄" icon="pi pi-print" onClick={() => handlePrint(rowData, 'label')} className="p-button-outlined p-button-success" />
# <Button label="명세서 인쇄" icon="pi pi-file-pdf" onClick={() => handlePrint(rowData, 'invoice')} className="p-button-outlined p-button-info" />
# <Button label="변경 요청" icon="pi pi-pencil" onClick={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }} className="p-button-outlined p-button-warning" />
# <Button label="주문 취소" icon="pi pi-trash" onClick={() => { setOrderDetailVisible(false); openCancelModal(rowData.id); }} className="p-button-outlined p-button-danger" />

# My injected one had:
# label="외주 추적" instead of "외주 처리"

text = text.replace('label="외주 추적"', 'label="외주 처리"')

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Modal contents fixed!")
