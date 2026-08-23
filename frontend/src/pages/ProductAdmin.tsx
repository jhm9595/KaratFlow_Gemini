import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TreeTable } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';


export const ProductAdmin = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const [treeData, setTreeData] = useState<any[]>([]);
    const [candidates, setCandidates] = useState([]);
    const [createVisible, setCreateVisible] = useState(false);
    const [createForm, setCreateForm] = useState({ brand: '', name: '', designCode: '', baseLaborFee: 0, imageUrl: '' });


    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return token ? { 'Authorization': `Bearer ${token}` } as any : {} as any;
    };

    const loadData = () => {
        fetch('http://localhost:8888/api/products', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                // Convert flat list to tree
                const brandMap: any = {};
                data.forEach((p: any) => {
                    const brand = p.brand || 'Unbranded';
                    if (!brandMap[brand]) brandMap[brand] = [];
                    brandMap[brand].push(p);
                });
                
                const tree = Object.keys(brandMap).map((brand, i) => ({
                    key: `brand-${i}`,
                    data: { brand: brand, name: '', designCode: '', baseLaborFee: '' },
                    children: brandMap[brand].map((p: any, j: number) => ({
                        key: `product-${i}-${j}`,
                        data: p
                    }))
                }));
                setTreeData(tree);
            })
            .catch(console.error);
        
        fetch('http://localhost:8888/api/products/candidates', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setCandidates(data))
            .catch(console.error);
    };

    useEffect(() => {
        loadData();
    }, []);

    
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
        .catch(_err => toast.current?.show({ severity: 'error', summary: '오류', detail: '등록에 실패했습니다.' }));
    };

    const confirmCandidate = (candidate: any) => {
        const payload = {
            brand: candidate.unmappedBrandName || 'Unknown Brand',
            designCode: candidate.unmappedProductName,
            name: candidate.unmappedProductName,
            baseLaborFee: 10000
        };
        fetch(`http://localhost:8888/api/products/candidates/${candidate.id}/confirm`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to confirm');
            toast.current?.show({ severity: 'success', summary: '성공', detail: '제품 카탈로그에 추가되었습니다.' });
            loadData();
        })
        .catch(err => {
            console.error(err);
            toast.current?.show({ severity: 'error', summary: '오류', detail: '승인 실패' });
        });
    };

    const imageBodyTemplate = (rowData: any) => {
        return rowData.imageUrl ? <img src={`http://localhost:8888${rowData.imageUrl}`} alt="Product" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} /> : <span>이미지 없음</span>;
    };

    const treeImageBodyTemplate = (node: any) => {
        return imageBodyTemplate(node.data);
    };

    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2">
                <Button label="승인" size="small" onClick={() => confirmCandidate(rowData)} />
                <Button label="매핑" size="small" severity="secondary" />
            </div>
        );
    };

    return (
        <div className="min-h-screen surface-ground p-5">
            <Toast ref={toast} />
            <div className="flex justify-content-between align-items-center mb-4">
                <div className="flex align-items-center">
                    <Button icon="pi pi-arrow-left" onClick={() => navigate('/')} className="p-button-text p-button-secondary mr-3" />
                    <h1 className="m-0">물건(제품) 관리</h1>
                </div>
                <Button label="새 물건 직접 등록" icon="pi pi-plus" className="p-button-primary" onClick={() => setCreateVisible(true)} />
            </div>

            <div className="surface-card p-4 border-round shadow-2">
                <TabView>
                    <TabPanel header="제품 카탈로그 (트리)">
                        <TreeTable value={treeData}>
                            <Column field="brand" header="브랜드" expander></Column>
                            <Column field="name" header="제품명"></Column>
                            <Column body={treeImageBodyTemplate} header="이미지"></Column>
                            <Column field="designCode" header="디자인 코드"></Column>
                            <Column field="baseLaborFee" header="기본공임"></Column>
                        </TreeTable>
                    </TabPanel>
                    <TabPanel header={`후보 리스트 (${candidates.length})`}>
                        <DataTable value={candidates} paginator rows={10}>
                            <Column field="id" header="주문항목 ID" />
                            <Column body={imageBodyTemplate} header="업로드된 이미지" />
                            <Column field="unmappedBrandName" header="입력된 브랜드" />
                            <Column field="unmappedProductName" header="입력된 제품명" />
                            <Column body={actionBodyTemplate} header="액션" />
                        </DataTable>
                    </TabPanel>
                </TabView>
            </div>
        
            <Dialog header="새 물건 직접 등록" visible={createVisible} style={{ width: '50vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} onHide={() => setCreateVisible(false)} className="p-fluid">
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
            </Dialog>

        </div>
    );
};
