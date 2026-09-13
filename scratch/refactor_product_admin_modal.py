import codecs

with codecs.open('frontend/src/pages/ProductAdmin.tsx', 'r', 'utf-8') as f:
    text = f.read()

old_modal = """            <Dialog header="새 물건 직접 등록" visible={createVisible} style={{ width: '40vw' }} onHide={() => setCreateVisible(false)}>
                <div className="flex flex-column gap-3 p-fluid">
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon">브랜드</span>
                        <InputText value={createForm.brand} onChange={(e) => setCreateForm({...createForm, brand: e.target.value})} placeholder="브랜드명" />
                    </div>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon">제품명</span>
                        <InputText value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} placeholder="제품명 (필수)" />
                    </div>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon">디자인 코드</span>
                        <InputText value={createForm.designCode} onChange={(e) => setCreateForm({...createForm, designCode: e.target.value})} placeholder="디자인 코드 (선택)" />
                    </div>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon">이미지</span>
                        <input type="file" onChange={handleFileUpload} accept="image/*" className="p-inputtext p-component" style={{padding: '0.5rem'}} />
                    </div>
                    {createForm.imageUrl && <img src={`http://localhost:8888${createForm.imageUrl}`} alt="preview" style={{width: '100px', borderRadius: '4px'}} />}
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon">기본 공임</span>
                        <InputNumber value={createForm.baseLaborFee} onValueChange={(e) => setCreateForm({...createForm, baseLaborFee: e.value as number || 0})} mode="currency" currency="KRW" locale="ko-KR" />
                    </div>
                </div>
                <div className="flex justify-content-end mt-4">
                    <Button label="취소" icon="pi pi-times" onClick={() => setCreateVisible(false)} className="p-button-text p-button-secondary mr-2" />
                    <Button label="등록" icon="pi pi-check" onClick={submitCreateProduct} className="p-button-primary" />
                </div>
            </Dialog>"""

new_modal = """            <Dialog header="새 물건 직접 등록" visible={createVisible} style={{ width: '50vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} onHide={() => setCreateVisible(false)} className="p-fluid">
                <div className="formgrid grid mt-2">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="brand" className="font-bold">브랜드</label>
                        <InputText id="brand" value={createForm.brand} onChange={(e) => setCreateForm({...createForm, brand: e.target.value})} placeholder="브랜드명" />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="name" className="font-bold">제품명 <span className="text-red-500">*</span></label>
                        <InputText id="name" value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} placeholder="제품명" />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="designCode" className="font-bold">디자인 코드</label>
                        <InputText id="designCode" value={createForm.designCode} onChange={(e) => setCreateForm({...createForm, designCode: e.target.value})} placeholder="디자인 코드" />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="baseLaborFee" className="font-bold">기본 공임</label>
                        <InputNumber id="baseLaborFee" value={createForm.baseLaborFee} onValueChange={(e) => setCreateForm({...createForm, baseLaborFee: e.value as number || 0})} mode="currency" currency="KRW" locale="ko-KR" />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">제품 이미지</label>
                        <div className="flex align-items-center gap-3">
                            <input type="file" onChange={handleFileUpload} accept="image/*" className="p-inputtext p-component flex-1" style={{padding: '0.5rem'}} />
                            {createForm.imageUrl && <img src={`http://localhost:8888${createForm.imageUrl}`} alt="preview" className="shadow-2 border-round" style={{width: '50px', height: '50px', objectFit: 'cover'}} />}
                        </div>
                    </div>
                </div>
                <div className="flex justify-content-end mt-4 pt-3 border-top-1 surface-border">
                    <Button label="취소" icon="pi pi-times" onClick={() => setCreateVisible(false)} className="p-button-text p-button-secondary mr-2" style={{width: 'auto'}} />
                    <Button label="등록" icon="pi pi-check" onClick={submitCreateProduct} className="p-button-primary" style={{width: 'auto'}} />
                </div>
            </Dialog>"""

text = text.replace(old_modal, new_modal)

with codecs.open('frontend/src/pages/ProductAdmin.tsx', 'w', 'utf-8') as f:
    f.write(text)
