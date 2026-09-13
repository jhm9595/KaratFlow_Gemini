import codecs

with codecs.open('frontend/src/pages/ProductAdmin.tsx', 'r', 'utf-8') as f:
    text = f.read()

imports = """import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
"""
if 'InputText' not in text:
    text = text.replace("import { Toast } from 'primereact/toast';", "import { Toast } from 'primereact/toast';\n" + imports)

states = """    const [createVisible, setCreateVisible] = useState(false);
    const [createForm, setCreateForm] = useState({ brand: '', name: '', designCode: '', baseLaborFee: 0, imageUrl: '' });
"""
if 'createVisible' not in text:
    text = text.replace('const [candidates, setCandidates] = useState([]);', 'const [candidates, setCandidates] = useState([]);\n' + states)

create_method = """
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
            setCreateForm({ ...createForm, imageUrl: data.url });
            toast.current?.show({ severity: 'success', summary: '성공', detail: '이미지가 업로드되었습니다.' });
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: '오류', detail: '이미지 업로드 실패' });
        }
    };

    const submitCreateProduct = () => {
        fetch('http://localhost:8888/api/products', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(createForm)
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to create');
            toast.current?.show({ severity: 'success', summary: '성공', detail: '새로운 물건이 등록되었습니다.' });
            setCreateVisible(false);
            setCreateForm({ brand: '', name: '', designCode: '', baseLaborFee: 0, imageUrl: '' });
            loadData();
        })
        .catch(err => toast.current?.show({ severity: 'error', summary: '오류', detail: '등록에 실패했습니다.' }));
    };
"""
if 'submitCreateProduct' not in text:
    text = text.replace('const confirmCandidate', create_method + '\n    const confirmCandidate')

add_btn = """<Button label="새 물건 직접 등록" icon="pi pi-plus" className="p-button-primary" onClick={() => setCreateVisible(true)} />"""
if '새 물건 직접 등록' not in text:
    text = text.replace('<h1 className="m-0">물건(제품) 관리</h1>\n                </div>', '<h1 className="m-0">물건(제품) 관리</h1>\n                </div>\n                ' + add_btn)

modal = """
            <Dialog header="새 물건 직접 등록" visible={createVisible} style={{ width: '40vw' }} onHide={() => setCreateVisible(false)}>
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
            </Dialog>
"""
if '새 물건 직접 등록' in modal and modal not in text:
    text = text.replace('</div>\n    );\n}', modal + '\n        </div>\n    );\n}')

with codecs.open('frontend/src/pages/ProductAdmin.tsx', 'w', 'utf-8') as f:
    f.write(text)
