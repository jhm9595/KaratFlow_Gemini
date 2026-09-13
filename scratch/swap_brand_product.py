import codecs

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

old_block = """                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">제품</span>
                            <AutoComplete value={selectedProduct} suggestions={filteredProducts} completeMethod={searchProduct} field="name" 
                                onChange={(e) => {
                                    setSelectedProduct(e.value);
                                    if (typeof e.value === 'string') {
                                        setCreateOrderForm({...createOrderForm, unmappedProductName: e.value});
                                    }
                                }} 
                                placeholder="제품 검색 또는 직접 입력" />
                        </div>
                        {(!selectedProduct || typeof selectedProduct === 'string') && (
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">브랜드(옵션)</span>
                                <InputText value={createOrderForm.unmappedBrandName} onChange={(e) => setCreateOrderForm({...createOrderForm, unmappedBrandName: e.target.value})} placeholder="브랜드명" />
                            </div>
                        )}"""

new_block = """                        {(!selectedProduct || typeof selectedProduct === 'string') && (
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">브랜드(옵션)</span>
                                <InputText value={createOrderForm.unmappedBrandName} onChange={(e) => setCreateOrderForm({...createOrderForm, unmappedBrandName: e.target.value})} placeholder="브랜드명" />
                            </div>
                        )}
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">제품</span>
                            <AutoComplete value={selectedProduct} suggestions={filteredProducts} completeMethod={searchProduct} field="name" 
                                onChange={(e) => {
                                    setSelectedProduct(e.value);
                                    if (typeof e.value === 'string') {
                                        setCreateOrderForm({...createOrderForm, unmappedProductName: e.value});
                                    }
                                }} 
                                placeholder="제품 검색 또는 직접 입력" />
                        </div>"""

text = text.replace(old_block, new_block)

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)
