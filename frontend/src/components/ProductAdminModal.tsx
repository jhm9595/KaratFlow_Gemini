import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';


export const ProductAdminModal = ({ visible, onHide, toast, getAuthHeaders }: any) => {
    const [products, setProducts] = useState([]);
    const [candidates, setCandidates] = useState([]);

    const loadData = () => {
        fetch('http://localhost:8888/api/products', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(console.error);
        
        fetch('http://localhost:8888/api/products/candidates', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setCandidates(data))
            .catch(console.error);
    };

    useEffect(() => {
        if (visible) loadData();
    }, [visible]);

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
            toast.current.show({ severity: 'success', summary: '성공', detail: '제품 카탈로그에 추가되었습니다.' });
            loadData();
        })
        .catch(err => {
            console.error(err);
            toast.current.show({ severity: 'error', summary: '오류', detail: '승인 실패' });
        });
    };

    const imageBodyTemplate = (rowData: any) => {
        return rowData.imageUrl ? <img src={`http://localhost:8888${rowData.imageUrl}`} alt="Product" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} /> : <span>이미지 없음</span>;
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
        <Dialog header="물건(제품) 관리" visible={visible} style={{ width: '60vw' }} onHide={onHide}>
            <TabView>
                <TabPanel header="제품 카탈로그">
                    <DataTable value={products} paginator rows={5}>
                        <Column field="id" header="ID" />
                        <Column body={imageBodyTemplate} header="이미지" />
                        <Column field="brand" header="브랜드" />
                        <Column field="name" header="제품명" />
                        <Column field="designCode" header="코드" />
                        <Column field="baseLaborFee" header="기본공임" />
                    </DataTable>
                </TabPanel>
                <TabPanel header={`후보 리스트 (${candidates.length})`}>
                    <DataTable value={candidates} paginator rows={5}>
                        <Column field="id" header="주문항목 ID" />
                        <Column body={imageBodyTemplate} header="업로드된 이미지" />
                        <Column field="unmappedBrandName" header="입력된 브랜드" />
                        <Column field="unmappedProductName" header="입력된 제품명" />
                        <Column body={actionBodyTemplate} header="액션" />
                    </DataTable>
                </TabPanel>
            </TabView>
        </Dialog>
    );
};
