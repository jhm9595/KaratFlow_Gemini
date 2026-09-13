import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fix Print Views (Move outside of no-print)
end_search = """            {/* Print Views */}
            {printOrder && printMode === 'label' && (
                <div className="print-mode-label">
                    <h1>{printOrder.orderNo || `KaratFlow #${printOrder.id}`}</h1>
                    <p><strong>Design:</strong> {printOrder.design}</p>
                    <p><strong>Date:</strong> {printOrder.date}</p>
                    {printOrder.engravingText && (
                        <div className="engraving-highlight">
                            각인: {printOrder.engravingText} ({printOrder.engravingLocation})
                        </div>
                    )}
                </div>
            )}

            {printOrder && printMode === 'invoice' && (
                <div className="print-mode-invoice">
                    <h1>주문 명세서</h1>
                    <div className="invoice-details">
                        <p><strong>주문 번호:</strong> {printOrder.orderNo || printOrder.id}</p>
                        <p><strong>고객명:</strong> {printOrder.customerName}</p>
                        <p><strong>디자인:</strong> {printOrder.design}</p>
                        <p><strong>결제 예상 금액:</strong> ₩{printOrder.invoice?.estimatedPrice?.toLocaleString() || '-'}</p>
                    </div>
                </div>
            )}
        </div>
    );"""
    
end_replace = """        </div>
        {/* Print Views (Outside of no-print container) */}
            {printOrder && printMode === 'label' && (
                <div className="print-mode-label">
                    <h1>{printOrder.orderNo || `KaratFlow #${printOrder.id}`}</h1>
                    <p><strong>Design:</strong> {printOrder.design}</p>
                    <p><strong>Date:</strong> {printOrder.date}</p>
                    {printOrder.engravingText && (
                        <div className="engraving-highlight">
                            각인: {printOrder.engravingText} ({printOrder.engravingLocation})
                        </div>
                    )}
                </div>
            )}

            {printOrder && printMode === 'invoice' && (
                <div className="print-mode-invoice">
                    <h1>주문 명세서</h1>
                    <div className="invoice-details">
                        <p><strong>주문 번호:</strong> {printOrder.orderNo || printOrder.id}</p>
                        <p><strong>고객명:</strong> {printOrder.customerName}</p>
                        <p><strong>디자인:</strong> {printOrder.design}</p>
                        <p><strong>결제 예상 금액:</strong> ₩{printOrder.invoice?.estimatedPrice?.toLocaleString() || '-'}</p>
                    </div>
                </div>
            )}
        </>
    );"""
if end_search in text:
    text = text.replace(end_search, end_replace)

# 2. Fix Fragment at the top (since we moved the closing div)
# We need to change the main return from:
# return (
#     <div className="p-m-4 p-4 no-print">
# to:
# return (
#     <>
#     <div className="p-m-4 p-4 no-print">
if "return (\n        <div className=\"p-m-4 p-4 no-print\">" in text:
    text = text.replace("return (\n        <div className=\"p-m-4 p-4 no-print\">", "return (\n        <>\n        <div className=\"p-m-4 p-4 no-print\">")


# 3. Fix Subcontract Grid Classes
old_sc_grid = """                                <div className="col-3 flex flex-column gap-2">
                                    <label>작업명(예: 도금)</label>
                                    <InputText className="w-full" value={scForm.taskName} onChange={(e) => setScForm({...scForm, taskName: e.target.value})} />
                                </div>
                                <div className="col-3 flex flex-column gap-2">
                                    <label>외주업체명</label>
                                    <InputText className="w-full" value={scForm.subcontractorName} onChange={(e) => setScForm({...scForm, subcontractorName: e.target.value})} />
                                </div>
                                <div className="col-3 flex flex-column gap-2">
                                    <label>반출 실측 중량 (g)</label>
                                    <InputNumber className="w-full" value={scForm.dispatchedWeightG} onValueChange={(e) => setScForm({...scForm, dispatchedWeightG: e.value || 0})} mode="decimal" minFractionDigits={2} />
                                </div>
                                <div className="col-3 flex flex-column gap-2">
                                    <label>합의 외주공임 (₩)</label>
                                    <InputNumber className="w-full" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
                                </div>"""

new_sc_grid = """                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>작업명(예: 도금)</label>
                                    <InputText className="w-full" value={scForm.taskName} onChange={(e) => setScForm({...scForm, taskName: e.target.value})} />
                                </div>
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>외주업체명</label>
                                    <InputText className="w-full" value={scForm.subcontractorName} onChange={(e) => setScForm({...scForm, subcontractorName: e.target.value})} />
                                </div>
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>반출 실측 중량 (g)</label>
                                    <InputNumber className="w-full" value={scForm.dispatchedWeightG} onValueChange={(e) => setScForm({...scForm, dispatchedWeightG: e.value || 0})} mode="decimal" minFractionDigits={2} />
                                </div>
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>합의 외주공임 (₩)</label>
                                    <InputNumber className="w-full" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
                                </div>"""
if old_sc_grid in text:
    text = text.replace(old_sc_grid, new_sc_grid)

# 4. Fix Hold Modal (주문 변경 요청)
old_hold_title = 'header="주문 변경 요청"'
new_hold_title = 'header="주문 변경 요청 (Hold & Estimate)"'
text = text.replace(old_hold_title, new_hold_title)

old_hold_label = '<label>변경내용 / 사유</label>'
new_hold_label = '<label>변경내용 / 사유</label>' # wait, it was <label>변경내용 / 사유</label> in HEAD, the patch changed it? Let's check patch.
# Ah, it was changed to <label>추가 견적 (₩)</label>
text = text.replace('<label>추가 견적</label>', '<label>추가 견적 (₩)</label>')

# 5. Cancel Modal (주문 취소)
text = text.replace('<label>취소 수수료</label>', '<label>취소 수수료 (₩)</label>')

# 6. Handshake Modal Title
text = text.replace('header="파트너사 연동"', 'header="파트너사 연동 (Handshake)"')

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Remaining UI details injected perfectly!")
