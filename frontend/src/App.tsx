import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import i18n from './i18n';

function App() {
    const { t } = useTranslation();
    const toast = useRef<any>(null);
    const [changeModalVisible, setChangeModalVisible] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [partnerModalVisible, setPartnerModalVisible] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8888/api/orders')
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error('Error fetching orders:', err));
    }, []);

    const mockTimeline = [
        { status: t('stage_cad'), date: '10:00' },
        { status: t('stage_casting'), date: '12:00' },
        { status: t('stage_polishing'), date: '15:00' },
        { status: t('stage_plating'), date: t('pending') },
        { status: t('stage_inspection'), date: t('pending') }
    ];

    const showHoldAlert = () => {
        toast.current?.show({ severity: 'warn', summary: t('alert_title'), detail: t('alert_desc'), life: 3000 });
    };

    const statusBodyTemplate = (rowData: any) => {
        const badgeClass = rowData.isHold ? 'p-badge-danger' : 'p-badge-success';
        return <span className={"p-badge " + badgeClass}>{rowData.isHold ? t('hold') : rowData.stage}</span>;
    };

    const toggleLanguage = () => {
        const currentLang = i18n.language || window.localStorage.getItem('i18nextLng') || 'ko';
        const nextLang = currentLang.startsWith('ko') ? 'en' : 'ko';
        i18n.changeLanguage(nextLang);
    };

    return (
        <div className="p-m-4 p-4">
            <Toast ref={toast} />
            <div className="flex justify-content-between align-items-center mb-4">
                <h2>{t('title')}</h2>
                <div>
                    <Button label={t('lang')} icon="pi pi-globe" className="p-button-secondary p-button-outlined mr-2" onClick={toggleLanguage} />
                    <Button label={t('invite_partner')} icon="pi pi-users" className="p-button-info mr-2" onClick={() => setPartnerModalVisible(true)} />
                    <Button label={t('simulate_hold')} icon="pi pi-bell" className="p-button-warning" onClick={showHoldAlert} />
                </div>
            </div>

            <div className="grid">
                <div className="col-12 md:col-8">
                    {/* @ts-ignore */}
                    <Card title={t('active_orders')}>
                        {/* @ts-ignore */}
                        <DataTable value={orders} responsiveLayout="scroll">
                            <Column field="id" header={t('order_id')}></Column>
                            <Column field="design" header={t('design')}></Column>
                            <Column field="date" header={t('date')}></Column>
                            <Column field="stage" header={t('status')} body={statusBodyTemplate}></Column>
                            <Column body={() => <Button icon="pi pi-pencil" onClick={() => setChangeModalVisible(true)} className="p-button-rounded p-button-text" />} />
                        </DataTable>
                    </Card>
                </div>
                
                <div className="col-12 md:col-4">
                    {/* @ts-ignore */}
                    <Card title={t('pipeline')}>
                        {/* @ts-ignore */}
                        <Timeline value={mockTimeline} content={(item: any) => item.status} opposite={(item: any) => item.date} />
                    </Card>
                </div>
            </div>

            {/* @ts-ignore */}
            <Dialog header={t('change_request')} visible={changeModalVisible} style={{ width: '50vw' }} onHide={() => setChangeModalVisible(false)}>
                <p className="m-0" dangerouslySetInnerHTML={{ __html: t('change_desc') }}></p>
                <div className="flex justify-content-end mt-4">
                    <Button label={t('cancel')} icon="pi pi-times" onClick={() => setChangeModalVisible(false)} className="p-button-text" />
                    <Button label={t('submit')} icon="pi pi-check" onClick={() => { setChangeModalVisible(false); showHoldAlert(); }} autoFocus />
                </div>
            </Dialog>

            {/* @ts-ignore */}
            <Dialog header={t('handshake')} visible={partnerModalVisible} style={{ width: '50vw' }} onHide={() => setPartnerModalVisible(false)}>
                <p className="m-0 mb-3">{t('handshake_desc')}</p>
                <div className="flex justify-content-end mt-4">
                    <Button label={t('verify')} icon="pi pi-check" onClick={() => { setPartnerModalVisible(false); toast.current?.show({ severity: 'success', summary: t('success'), detail: t('verify_success'), life: 3000 }); }} autoFocus />
                </div>
            </Dialog>

        </div>
    );
}

export default App;
