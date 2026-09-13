import codecs

code = """import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';

interface ProcessManagerProps {
    visible: boolean;
    onHide: () => void;
}

export const ProcessManager: React.FC<ProcessManagerProps> = ({ visible, onHide }) => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = React.useRef<Toast>(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8888';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('jwtToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const loadTemplates = () => {
        setLoading(true);
        fetch(`${apiUrl}/api/process-templates`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setTemplates(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load templates", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (visible) {
            loadTemplates();
        }
    }, [visible]);

    const header = (
        <div className="flex justify-content-between align-items-center">
            <span>공정 템플릿 관리</span>
            <Button icon="pi pi-refresh" className="p-button-text p-button-sm" onClick={loadTemplates} />
        </div>
    );

    const stagesTemplate = (rowData: any) => {
        try {
            const stages = JSON.parse(rowData.stagesJson);
            return stages.join(' ➔ ');
        } catch {
            return rowData.stagesJson;
        }
    };

    return (
        <Dialog header={header} visible={visible} style={{ width: '60vw' }} onHide={onHide}>
            <Toast ref={toast} />
            <div className="p-fluid">
                <div className="flex justify-content-between mb-3 align-items-center">
                    <p className="m-0 text-600">공장마다 다른 공정 단계를 템플릿으로 정의할 수 있습니다. 주문 생성 시 템플릿을 선택하세요.</p>
                    <Button label="새 템플릿 추가" icon="pi pi-plus" className="p-button-sm" style={{width: 'auto'}} />
                </div>
                
                <DataTable value={templates} loading={loading} emptyMessage="저장된 공정 템플릿이 없습니다.">
                    <Column field="name" header="템플릿 이름" style={{ width: '25%' }}></Column>
                    <Column field="description" header="설명" style={{ width: '25%' }}></Column>
                    <Column body={stagesTemplate} header="공정 단계"></Column>
                    <Column body={(rowData) => (
                        <div className="flex gap-2">
                            <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-info" />
                            <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger" />
                        </div>
                    )} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>
        </Dialog>
    );
};
"""

with codecs.open('frontend/src/ProcessManager.tsx', 'w', 'utf-8') as f:
    f.write(code)

print("ProcessManager.tsx written with UTF-8")
