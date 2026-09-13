import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

new_dialog = r'''<Dialog header={
                selectedOrderId && orders.find(o => o.id === selectedOrderId) ? (
                    <div className="flex justify-content-between align-items-center w-full" style={{ paddingRight: '2rem' }}>
                        <span>주문 상세 정보</span>
                        <div className="flex gap-2">
                            <Button icon="pi pi-print" tooltip="라벨 인쇄" tooltipOptions={{ position: 'bottom' }} onClick={() => handlePrint(orders.find(o => o.id === selectedOrderId), 'label')} className="p-button-rounded p-button-text p-button-success p-button-sm" />
                            <Button icon="pi pi-file-pdf" tooltip="명세서 인쇄" tooltipOptions={{ position: 'bottom' }} onClick={() => handlePrint(orders.find(o => o.id === selectedOrderId), 'invoice')} className="p-button-rounded p-button-text p-button-info p-button-sm" />
                        </div>
                    </div>
                ) : "주문 상세 정보"
            } visible={orderDetailVisible} style={{ width: '40vw' }} onHide={() => setOrderDetailVisible(false)}>'''

text = re.sub(r'<Dialog header="주문 상세 정보"[^>]*>', new_dialog, text)
text = re.sub(r'<Dialog header=\{[^}]*\}[^>]*visible=\{orderDetailVisible\}[^>]*>', new_dialog, text) # in case it was half replaced

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed!")
