import os

base_path = 'frontend/src'

files = {
    os.path.join(base_path, 'main.tsx'): '''import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { PrimeReactProvider } from 'primereact/api'

// Core styles
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
)
''',
    os.path.join(base_path, 'App.tsx'): '''import { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';

// Mock data
const mockOrders = [
    { id: 1, design: 'R-101', stage: 'CAD', isHold: false, date: '2026-08-17' },
    { id: 2, design: 'N-202', stage: 'PLATING', isHold: true, date: '2026-08-16' },
    { id: 3, design: 'E-303', stage: 'INSPECTION', isHold: false, date: '2026-08-15' },
];

const mockTimeline = [
    { status: 'CAD', date: '10:00' },
    { status: 'CASTING', date: '12:00' },
    { status: 'POLISHING', date: '15:00' },
    { status: 'PLATING', date: 'Pending' },
    { status: 'INSPECTION', date: 'Pending' }
];

function App() {
    const toast = useRef<Toast>(null);
    const [changeModalVisible, setChangeModalVisible] = useState(false);

    const showHoldAlert = () => {
        toast.current?.show({ severity: 'warn', summary: 'HOLD Alert', detail: 'WorkOrder #2 is on HOLD due to change request.', life: 3000 });
    };

    const statusBodyTemplate = (rowData: any) => {
        return <span className={p-badge }>{rowData.isHold ? 'HOLD' : rowData.stage}</span>;
    };

    return (
        <div className="p-m-4 p-4">
            <Toast ref={toast} />
            <div className="flex justify-content-between align-items-center mb-4">
                <h2>KaratFlow Gemini - Dashboard</h2>
                <Button label="Simulate HOLD Alert" icon="pi pi-bell" className="p-button-warning" onClick={showHoldAlert} />
            </div>

            <div className="grid">
                <div className="col-12 md:col-8">
                    <Card title="Active Work Orders">
                        <DataTable value={mockOrders} responsiveLayout="scroll">
                            <Column field="id" header="Order ID"></Column>
                            <Column field="design" header="Design"></Column>
                            <Column field="date" header="Date"></Column>
                            <Column field="stage" header="Status" body={statusBodyTemplate}></Column>
                            <Column body={() => <Button icon="pi pi-pencil" onClick={() => setChangeModalVisible(true)} className="p-button-rounded p-button-text" />} />
                        </DataTable>
                    </Card>
                </div>
                
                <div className="col-12 md:col-4">
                    <Card title="Process Pipeline (Order #2)">
                        <Timeline value={mockTimeline} content={(item) => item.status} opposite={(item) => item.date} />
                    </Card>
                </div>
            </div>

            <Dialog header="Request Order Change" visible={changeModalVisible} style={{ width: '50vw' }} onHide={() => setChangeModalVisible(false)}>
                <p className="m-0">
                    Select change type (Ring Size, Color, Engraving).
                    Warning: Cutoff stage rules will apply automatically.
                </p>
                <div className="flex justify-content-end mt-4">
                    <Button label="Cancel" icon="pi pi-times" onClick={() => setChangeModalVisible(false)} className="p-button-text" />
                    <Button label="Submit Change" icon="pi pi-check" onClick={() => { setChangeModalVisible(false); showHoldAlert(); }} autoFocus />
                </div>
            </Dialog>
        </div>
    );
}

export default App;
'''
}

for path, content in files.items():
    with open(path, 'w') as f:
        f.write(content)

print("Frontend components created.")
