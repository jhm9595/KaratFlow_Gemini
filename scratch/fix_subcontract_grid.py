import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_subcontract_grid = """                                <div className="col-3">
                                    <label>작업명(ex 도금)</label>
                                    <InputText className="w-full mt-1" value={scForm.taskName} onChange={(e) => setScForm({...scForm, taskName: e.target.value})} />
                                </div>
                                <div className="col-3">
                                    <label>외주업체명</label>
                                    <InputText className="w-full mt-1" value={scForm.subcontractorName} onChange={(e) => setScForm({...scForm, subcontractorName: e.target.value})} />
                                </div>
                                <div className="col-3">
                                    <label>반출 실측 중량 (g)</label>
                                    <InputNumber className="w-full mt-1" value={scForm.dispatchedWeightG} onValueChange={(e) => setScForm({...scForm, dispatchedWeightG: e.value || 0})} mode="decimal" minFractionDigits={2} />
                                </div>
                                <div className="col-3">
                                    <label>합의 외주공임 (원)</label>
                                    <InputNumber className="w-full mt-1" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
                                </div>"""

new_subcontract_grid = """                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>작업명(ex 도금)</label>
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
                                    <label>합의 외주공임 (원)</label>
                                    <InputNumber className="w-full" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
                                </div>"""

text = text.replace(old_subcontract_grid, new_subcontract_grid)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Subcontract grid fixed!")
