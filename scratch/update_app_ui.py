import re
import codecs

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

# 1. Add Imports
imports = """import { AutoComplete } from 'primereact/autocomplete';
import { ProductAdminModal } from './components/ProductAdminModal';
"""
if "import { AutoComplete }" not in text:
    text = text.replace("import { Timeline } from 'primereact/timeline';", "import { Timeline } from 'primereact/timeline';\n" + imports)

# 2. Add state for ProductAdminModal & Products
if "productAdminVisible" not in text:
    text = re.sub(r'const \[createOrderModalVisible, setCreateOrderModalVisible\] = useState\(false\);',
                  r'const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);\n    const [productAdminVisible, setProductAdminVisible] = useState(false);\n    const [products, setProducts] = useState<any[]>([]);\n    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);\n    const [selectedProduct, setSelectedProduct] = useState<any>(null);', text)

    # Add fetch products in fetchOrders
    fetch_prod = r"        fetch('http://localhost:8888/api/products', { headers: getAuthHeaders() })\n            .then(res => res.json())\n            .then(data => setProducts(data))\n            .catch(console.error);"
    text = text.replace("fetch('http://localhost:8888/api/orders', { headers: getAuthHeaders() })", fetch_prod + "\n        fetch('http://localhost:8888/api/orders', { headers: getAuthHeaders() })")

# 4. Modify createOrderForm initial state
old_form = r'const \[createOrderForm, setCreateOrderForm\] = useState\(\{[\s\S]*?\}\);'
new_form = r'''const [createOrderForm, setCreateOrderForm] = useState({
        orderType: 'B2C',
        customerName: '',
        customerPhone: '',
        designId: null,
        unmappedBrandName: '',
        unmappedProductName: '',
        imageUrl: '',
        quantity: 1,
        engravingText: '',
        engravingLocation: '',
        surfaceFinish: '',
        finalConsumerPrice: 0
    });'''
text = re.sub(old_form, new_form, text)

# 5. Add File Upload & search logic
upload_logic = """
    const handleFileUpload = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('http://localhost:8888/api/uploads', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setCreateOrderForm({ ...createOrderForm, imageUrl: data.url });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Image uploaded' });
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Image upload failed' });
        }
    };

    const searchProduct = (event: any) => {
        setTimeout(() => {
            let _filteredProducts;
            if (!event.query.trim().length) {
                _filteredProducts = [...products];
            } else {
                _filteredProducts = products.filter((product) => {
                    return product.name.toLowerCase().startsWith(event.query.toLowerCase()) || 
                           (product.brand && product.brand.toLowerCase().startsWith(event.query.toLowerCase()));
                });
            }
            setFilteredProducts(_filteredProducts);
        }, 250);
    };
"""
if "handleFileUpload" not in text:
    text = re.sub(r'const submitCreateOrder = \(\) => \{', upload_logic + '\n    const submitCreateOrder = () => {', text)

# 6. Update submitCreateOrder logic
text = re.sub(r'designId: 1, // 하드코딩', r'', text)
text = re.sub(r'const payload = \{[\s\S]*?\.\.\.createOrderForm[\s\S]*?\};', r'''const payload = {
            ...createOrderForm,
            designId: selectedProduct ? selectedProduct.id : null,
            unmappedBrandName: selectedProduct ? '' : createOrderForm.unmappedBrandName,
            unmappedProductName: selectedProduct ? '' : (typeof selectedProduct === 'string' ? selectedProduct : createOrderForm.unmappedProductName),
        };''', text)

# 7. Add Product Admin button next to Create Order button
admin_btn = r'<Button label="물건 관리" icon="pi pi-box" className="p-button-secondary p-button-sm shadow-1 mr-2" onClick={() => setProductAdminVisible(true)} />\n                                <Button label="새 주문 생성"'
text = re.sub(r'<Button label="새 주문 생성"', admin_btn, text)

# 8. Add DataTable columns (Image, Quantity)
img_col = r'''<Column body={(rowData) => rowData.imageUrl ? <img src={`http://localhost:8888${rowData.imageUrl}`} alt="img" style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px'}}/> : <span>-</span>} header="이미지" style={{ width: '80px' }}></Column>
                                <Column field="orderNo"'''
text = re.sub(r'<Column field="orderNo"', img_col, text)

qty_col = r'''<Column field="quantity" header="수량" sortable></Column>
                                <Column field="customerName"'''
text = re.sub(r'<Column field="customerName"', qty_col, text)

# 9. Modify New Order Modal UI
new_modal_fields = r'''<div className="p-inputgroup">
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
                        )}
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">이미지</span>
                            <input type="file" onChange={handleFileUpload} accept="image/*" className="p-inputtext p-component" style={{padding: '0.5rem'}} />
                        </div>
                        {createOrderForm.imageUrl && <img src={`http://localhost:8888${createOrderForm.imageUrl}`} alt="preview" style={{width: '100px', borderRadius: '4px'}} />}
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">수량</span>
                            <InputNumber value={createOrderForm.quantity} onValueChange={(e) => setCreateOrderForm({...createOrderForm, quantity: e.value || 1})} min={1} />
                        </div>'''

text = re.sub(r'<div className="flex flex-column gap-3 p-fluid">[\s\S]*?<div className="p-inputgroup">\s*<span className="p-inputgroup-addon">구분</span>', 
              r'<div className="flex flex-column gap-3 p-fluid">\n                        ' + new_modal_fields + r'\n                        <div className="p-inputgroup">\n                            <span className="p-inputgroup-addon">구분</span>', text)

# 10. Inject ProductAdminModal component
if "<ProductAdminModal" not in text:
    text = re.sub(r'</Dialog>\s*</div>\s*</div>\s*\);\s*\}', r'</Dialog>\n\n                <ProductAdminModal visible={productAdminVisible} onHide={() => setProductAdminVisible(false)} toast={toast} getAuthHeaders={getAuthHeaders} />\n            </div>\n        </div>\n    );\n}', text)

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)

print('App.tsx updated!')
