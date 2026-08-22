import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Client } from '@stomp/stompjs';
import i18n from './i18n';

function App() {
    const { t } = useTranslation();
    const toast = useRef<any>(null);
    const [changeModalVisible, setChangeModalVisible] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [partnerModalVisible, setPartnerModalVisible] = useState(false);
    const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);
    
    const [dashboardStats, setDashboardStats] = useState({
        totalRevenue: 0,
        activeOrders: 0,
        totalOrders: 0,
        cancellationRate: 0
    });
    
    const [createOrderForm, setCreateOrderForm] = useState({
        orderType: 'B2C',
        customerName: '',
        customerPhone: '',
        designId: 1, // Defaulting to 1 for dummy
        engravingText: '',
        engravingLocation: '',
        surfaceFinish: '? ê´‘',
        finalConsumerPrice: 0
    });

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [printOrder, setPrintOrder] = useState<any>(null);
    const [printMode, setPrintMode] = useState<'label' | 'invoice' | null>(null);

    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelEstimate, setCancelEstimate] = useState<number | null>(null);

    const [subcontractModalVisible, setSubcontractModalVisible] = useState(false);
    const [subcontracts, setSubcontracts] = useState<any[]>([]);
    const [scForm, setScForm] = useState({ taskName: '', subcontractorName: '', dispatchedWeightG: 0, agreedLaborFee: 0 });
    const [receiveForm, setReceiveForm] = useState<{ [key: number]: number }>({});

    const [handshakes, setHandshakes] = useState<any[]>([]);
    const [handshakePin, setHandshakePin] = useState('');
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);
    const [businessNumber, setBusinessNumber] = useState('');
    const [businessResult, setBusinessResult] = useState<any>(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('jwtToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const openHandshakeModal = () => {
        fetch('http://localhost:8888/api/handshake', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setHandshakes(data);
                setPartnerModalVisible(true);
            });
    };

    const requestHandshake = () => {
        fetch('http://localhost:8888/api/handshake/request', { method: 'POST', headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setGeneratedPin(data.pinCode);
                setHandshakes([...handshakes, data]);
                toast.current?.show({ severity: 'success', summary: 'ë°œê¸‰ ?„ë£Œ', detail: '?ŒíŠ¸?ˆì‚¬ ?°ë™ PIN??ë°œê¸‰?˜ì—ˆ?µë‹ˆ??', life: 5000 });
            });
    };

    const submitCreateOrder = () => {
        fetch('http://localhost:8888/api/orders', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(createOrderForm)
        })
        .then(res => res.json())
        .then(() => {
            fetchOrders();
            setCreateOrderModalVisible(false);
            setCreateOrderForm({ orderType: 'B2C', customerName: '', customerPhone: '', designId: 1, engravingText: '', engravingLocation: '', surfaceFinish: '? ê´‘', finalConsumerPrice: 0 });
            toast.current?.show({ severity: 'success', summary: 'ì£¼ë¬¸ ?ì„± ?„ë£Œ', detail: '?ˆë¡œ??ì£¼ë¬¸???œìŠ¤?œì— ?±ë¡?˜ì—ˆ?µë‹ˆ??', life: 3000 });
        });
    };

    const verifyHandshake = () => {
        fetch('http://localhost:8888/api/handshake/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinCode: handshakePin })
        })
        .then(async (res) => {
            if (!res.ok) throw new Error();
            const data = await res.json();
            setHandshakes(handshakes.map(h => h.id === data.id ? data : h));
            toast.current?.show({ severity: 'success', summary: '?¸ì¦ ?„ë£Œ', detail: '?ŒíŠ¸?ˆì‚¬ ?°ë™???¹ì¸?˜ì—ˆ?µë‹ˆ??', life: 5000 });
            setHandshakePin('');
        })
        .catch(() => {
            toast.current?.show({ severity: 'error', summary: '?¸ì¦ ?¤íŒ¨', detail: '? íš¨?˜ì? ?Šê±°??ë§Œë£Œ??PIN?…ë‹ˆ??', life: 3000 });
        });
    };

    const verifyBusiness = () => {
        if (!businessNumber) return;
        fetch('http://localhost:8888/api/business/verify', { headers: getAuthHeaders(),
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessNumber })
        })
        .then(res => res.json())
        .then(data => {
            setBusinessResult(data);
            if (data.statusCode === '01') {
                toast.current?.show({ severity: 'success', summary: 'ì¡°íšŒ ?±ê³µ', detail: '?•ìƒ ?ì—… ì¤‘ì¸ ?¬ì—…?ì…?ˆë‹¤.', life: 3000 });
            } else {
                toast.current?.show({ severity: 'warn', summary: 'ì£¼ì˜', detail: 'ê³„ì†?¬ì—…?ê? ?„ë‹™?ˆë‹¤ (' + data.statusName + ')', life: 5000 });
            }
        });
    };

    const openSubcontractModal = (orderId: number) => {
        setSelectedOrderId(orderId);
        fetch(`http://localhost:8888/api/orders/${orderId}/subcontracts`)
            .then(res => res.json())
            .then(data => {
                setSubcontracts(data);
                setSubcontractModalVisible(true);
            });
    };

    const handleDispatchSubcontract = () => {
        fetch(`http://localhost:8888/api/orders/${selectedOrderId}/subcontracts/dispatch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scForm)
        })
        .then(res => res.json())
        .then(newTask => {
            setSubcontracts([...subcontracts, newTask]);
            setScForm({ taskName: '', subcontractorName: '', dispatchedWeightG: 0, agreedLaborFee: 0 });
            toast.current?.show({ severity: 'success', summary: '?¸ì£¼ ?±ë¡', detail: '?¸ì£¼ ë°˜ì¶œ??ê¸°ë¡?˜ì—ˆ?µë‹ˆ??', life: 3000 });
        });
    };

    const handleReceiveSubcontract = (taskId: number) => {
        const receivedWeightG = receiveForm[taskId];
        fetch(`http://localhost:8888/api/orders/${selectedOrderId}/subcontracts/${taskId}/receive`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receivedWeightG })
        })
        .then(res => res.json())
        .then(updatedTask => {
            setSubcontracts(subcontracts.map(s => s.id === taskId ? updatedTask : s));
            toast.current?.show({ severity: 'info', summary: 'ë°˜ì… ?„ë£Œ', detail: `ê°ëª¨?? ${updatedTask.lossWeightG}g`, life: 5000 });
        });
    };

    const openCancelModal = (orderId: number) => {
        setSelectedOrderId(orderId);
        fetch(`http://localhost:8888/api/orders/${orderId}/cancel-estimate`)
            .then(res => res.json())
            .then(data => {
                setCancelEstimate(data.estimatedFee);
                setCancelModalVisible(true);
            });
    };

    const submitCancelOrder = () => {
        if (!selectedOrderId) return;
        fetch(`http://localhost:8888/api/orders/${selectedOrderId}/cancel`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                toast.current?.show({ severity: 'success', summary: 'ì£¼ë¬¸ ì·¨ì†Œ ?„ë£Œ', detail: `?˜ìˆ˜ë£? ??{data.cancellationFee}`, life: 5000 });
                setCancelModalVisible(false);
                fetchOrders();
            });
    };

    const advanceStage = (orderId: number) => {
        fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'error') {
                    toast.current?.show({ severity: 'error', summary: '?¤ë¥˜', detail: data.message, life: 3000 });
                } else {
                    toast.current?.show({ severity: 'info', summary: 'ê³µì • ?´ë™', detail: `ì£¼ë¬¸ #${orderId} ê³µì •??[${data.newStage}] ?¨ê³„ë¡??´ë™?ˆìŠµ?ˆë‹¤.`, life: 3000 });
                    fetchOrders();
                }
            })
            .catch(err => {
                toast.current?.show({ severity: 'error', summary: '?¤ë¥˜', detail: 'ê³µì • ?¨ê³„ ?´ë™ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.', life: 3000 });
            });
    };

    const fetchOrders = () => {
        fetch('http://localhost:8888/api/orders', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error('Error fetching orders:', err));
            
        fetch('http://localhost:8888/api/orders/stats', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setDashboardStats(data))
            .catch(err => console.error('Error fetching stats:', err));
    };

    useEffect(() => {
        fetchOrders();

        const client = new Client({
            brokerURL: 'ws://localhost:8888/ws-alerts-raw',
            onConnect: () => {
                console.log('Connected to STOMP');
                client.subscribe('/topic/process-alerts', (message) => {
                    if (message.body) {
                        const payload = JSON.parse(message.body);
                        toast.current?.show({ 
                            severity: 'error', 
                            summary: t('alert_title'), 
                            detail: payload.message || t('alert_desc'), 
                            life: 5000 
                        });
                        fetchOrders();
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            }
        });
        client.activate();

        return () => {
            client.deactivate();
        };
    }, []);

    const submitChangeRequest = () => {
        if (!selectedOrderId) return;
        fetch(`http://localhost:8888/api/orders/${selectedOrderId}/hold`, { method: 'POST' })
            .then(() => {
                setChangeModalVisible(false);
            });
    };

    const mockTimeline = [
        { status: t('stage_cad'), date: '10:00' },
        { status: t('stage_casting'), date: '12:00' },
        { status: t('stage_polishing'), date: '15:00' },
        { status: t('stage_plating'), date: t('pending') },
        { status: t('stage_inspection'), date: t('pending') }
    ];

    const showHoldAlert = () => {
        // Fallback for simulate button if needed
        toast.current?.show({ severity: 'warn', summary: t('alert_title'), detail: t('alert_desc'), life: 3000 });
    };

    const statusBodyTemplate = (rowData: any) => {
        if (rowData.status === 'CANCELLED') {
            return (
                <div className="flex flex-column gap-1">
                    <span className="p-badge p-badge-secondary">ì·¨ì†Œ??/span>
                    {rowData.cancellationFee > 0 && <small className="text-red-500 font-bold">?„ì•½ê¸? ??rowData.cancellationFee.toLocaleString()}</small>}
                </div>
            );
        }
        const badgeClass = rowData.isHold ? 'p-badge-danger' : 'p-badge-success';
        return <span className={"p-badge " + badgeClass}>{rowData.isHold ? t('hold') : rowData.stage}</span>;
    };

    const toggleLanguage = () => {
        const currentLang = i18n.language || window.localStorage.getItem('i18nextLng') || 'ko';
        const nextLang = currentLang.startsWith('ko') ? 'en' : 'ko';
        i18n.changeLanguage(nextLang);
    };

    const surfaceFinishBodyTemplate = (rowData: any) => {
        if (!rowData.surfaceFinish) return <span className="text-500">-</span>;
        return <span className="p-badge p-badge-info">{rowData.surfaceFinish}</span>;
    };

    const engravingBodyTemplate = (rowData: any) => {
        if (!rowData.engravingText) return <span className="text-500">-</span>;
        return (
            <div className="flex flex-column gap-1">
                <span className="font-bold">{rowData.engravingText}</span>
                <small className="text-500">{rowData.engravingLocation || ''}</small>
            </div>
        );
    };

    const handlePrint = async (order: any, mode: 'label' | 'invoice') => {
        if (mode === 'invoice') {
            try {
                const res = await fetch(`http://localhost:8888/api/orders/${order.id}/invoice`);
                const invoiceData = await res.json();
                // Merge the invoice data with the basic order data
                setPrintOrder({ ...order, invoice: invoiceData });
            } catch (err) {
                console.error('Failed to fetch invoice data:', err);
                setPrintOrder(order); // Fallback
            }
        } else {
            setPrintOrder(order);
        }
        setPrintMode(mode);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const actionBodyTemplate = (rowData: any) => {
        if (rowData.status === 'CANCELLED') return <span className="text-400">?¡ì…˜ ?†ìŒ</span>;
        
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-forward" tooltip="ê³µì • ?´ë™" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-rounded p-button-success p-button-text" />
                <Button icon="pi pi-truck" tooltip="?¸ì£¼ ê°ëª¨ ì¶”ì " onClick={() => openSubcontractModal(rowData.id)} className="p-button-rounded p-button-secondary p-button-text" />
                <Button icon="pi pi-print" tooltip="?¼ë²¨ ?¸ì‡„" onClick={() => handlePrint(rowData, 'label')} className="p-button-rounded p-button-success p-button-text" />
                <Button icon="pi pi-file-pdf" tooltip="ëª…ì„¸???¸ì‡„" onClick={() => handlePrint(rowData, 'invoice')} className="p-button-rounded p-button-info p-button-text" />
                <Button icon="pi pi-pencil" tooltip="ë³€ê²??”ì²­" onClick={() => { setSelectedOrderId(rowData.id); setChangeModalVisible(true); }} className="p-button-rounded p-button-warning p-button-text" />
                <Button icon="pi pi-trash" tooltip="ì£¼ë¬¸ ì·¨ì†Œ" onClick={() => openCancelModal(rowData.id)} className="p-button-rounded p-button-danger p-button-text" />
            </div>
        );
    };

    return (
        <>
            <div className="p-m-4 p-4 no-print">
                <Toast ref={toast} />
                <div className="flex justify-content-between align-items-center mb-4">
                    <h2>{t('title')}</h2>
                    <div className="flex gap-2">
                        <Button label="??ì£¼ë¬¸ ?ì„±" icon="pi pi-plus" className="p-button-primary" onClick={() => setCreateOrderModalVisible(true)} />
                        <Button label={t('lang')} icon="pi pi-globe" className="p-button-secondary p-button-outlined" onClick={toggleLanguage} />
                        <Button label={t('invite_partner')} icon="pi pi-users" className="p-button-info" onClick={openHandshakeModal} />
                        <Button label={t('simulate_hold')} icon="pi pi-bell" className="p-button-warning" onClick={showHoldAlert} />
                    </div>
                </div>

                <div className="grid">
                    <div className="col-12 md:col-8">
                        {/* @ts-ignore */}
                        <Card title={t('active_orders')}>
                            {/* @ts-ignore */}
                            <DataTable value={orders} size="small" paginator rows={10} selectionMode="single" selection={selectedOrderId === null ? null : orders.find(o => o.id === selectedOrderId)} onSelectionChange={(e) => setSelectedOrderId(e.value?.id)} dataKey="id">
                                <Column field="orderNo" header="ì£¼ë¬¸ ë²ˆí˜¸" />
                                <Column field="id" header="ID" />
                                <Column field="design" header="Design Code" />
                                <Column field="customerName" header="ê³ ê°ëª? />
                                <Column field="date" header={t('date')}></Column>
                                <Column header={t('surface_finish')} body={surfaceFinishBodyTemplate}></Column>
                                <Column header={t('engraving')} body={engravingBodyTemplate}></Column>
                                <Column field="stage" header={t('status')} body={statusBodyTemplate}></Column>
                                <Column body={actionBodyTemplate} header="Action" />
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
                <Dialog header="??ì£¼ë¬¸ ?ì„±" visible={createOrderModalVisible} style={{ width: '50vw' }} onHide={() => setCreateOrderModalVisible(false)}>
                    <div className="flex flex-column gap-3 p-fluid">
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">êµ¬ë¶„</span>
                            <InputText value={createOrderForm.orderType} onChange={(e) => setCreateOrderForm({...createOrderForm, orderType: e.target.value})} placeholder="B2C, B2B ?? />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">ê³ ê°ëª?/span>
                            <InputText value={createOrderForm.customerName} onChange={(e) => setCreateOrderForm({...createOrderForm, customerName: e.target.value})} placeholder="ê³ ê° ?´ë¦„" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">?°ë½ì²?/span>
                            <InputText value={createOrderForm.customerPhone} onChange={(e) => setCreateOrderForm({...createOrderForm, customerPhone: e.target.value})} placeholder="010-0000-0000" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">ê°ì¸ ë¬¸êµ¬</span>
                            <InputText value={createOrderForm.engravingText} onChange={(e) => setCreateOrderForm({...createOrderForm, engravingText: e.target.value})} placeholder="ê°ì¸???ìŠ¤??(?µì…˜)" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">ê°ì¸ ?„ì¹˜</span>
                            <InputText value={createOrderForm.engravingLocation} onChange={(e) => setCreateOrderForm({...createOrderForm, engravingLocation: e.target.value})} placeholder="ë°˜ì? ?ˆìª½ ??(?µì…˜)" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">?œë©´ ì²˜ë¦¬</span>
                            <InputText value={createOrderForm.surfaceFinish} onChange={(e) => setCreateOrderForm({...createOrderForm, surfaceFinish: e.target.value})} placeholder="? ê´‘/ë¬´ê´‘" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">?Œë¹„?ê?(??</span>
                            <InputNumber value={createOrderForm.finalConsumerPrice} onValueChange={(e) => setCreateOrderForm({...createOrderForm, finalConsumerPrice: e.value || 0})} mode="currency" currency="KRW" locale="ko-KR" />
                        </div>
                    </div>
                    <div className="flex justify-content-end mt-4">
                        <Button label="ì·¨ì†Œ" icon="pi pi-times" onClick={() => setCreateOrderModalVisible(false)} className="p-button-text p-button-secondary mr-2" />
                        <Button label="ì£¼ë¬¸ ?±ë¡" icon="pi pi-check" onClick={submitCreateOrder} className="p-button-primary" autoFocus />
                    </div>
                </Dialog>

                {/* @ts-ignore */}
                <Dialog header={t('change_request')} visible={changeModalVisible} style={{ width: '50vw' }} onHide={() => setChangeModalVisible(false)}>
                    <p className="m-0" dangerouslySetInnerHTML={{ __html: t('change_desc') }}></p>
                    <div className="flex justify-content-end mt-4">
                        <Button label={t('cancel')} icon="pi pi-times" onClick={() => setChangeModalVisible(false)} className="p-button-text" />
                        <Button label={t('submit')} icon="pi pi-check" onClick={submitChangeRequest} autoFocus />
                    </div>
                </Dialog>

                {/* @ts-ignore */}
                <Dialog header="ì£¼ë¬¸ ì·¨ì†Œ ë°??„ì•½ê¸??•ì¸" visible={cancelModalVisible} style={{ width: '40vw' }} onHide={() => setCancelModalVisible(false)}>
                    <div className="flex flex-column align-items-center justify-content-center text-center p-4">
                        <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '3rem' }}></i>
                        <h2 className="mt-3">ì£¼ë¬¸???•ë§ ì·¨ì†Œ?˜ì‹œê² ìŠµ?ˆê¹Œ?</h2>
                        <p className="m-0 mb-4 text-600">
                            ?„ì¬ ê³µì • ì§„í–‰ ?íƒœ???°ë¼ ?„ì•½ê¸ˆì´ ë¶€ê³¼ë©?ˆë‹¤.<br/>
                            ??ë²?ì·¨ì†Œ??ì£¼ë¬¸?€ ë³µêµ¬?????†ìŠµ?ˆë‹¤.
                        </p>
                        
                        <div className="surface-100 p-4 border-round w-full">
                            <h3 className="m-0 mb-2">?ˆìƒ ?„ì•½ê¸?(ì·¨ì†Œ ?˜ìˆ˜ë£?</h3>
                            <h2 className="m-0 text-red-500">??cancelEstimate?.toLocaleString()}</h2>
                        </div>
                    </div>
                    <div className="flex justify-content-end mt-4">
                        <Button label="?Œì•„ê°€ê¸? icon="pi pi-times" onClick={() => setCancelModalVisible(false)} className="p-button-text p-button-secondary" />
                        <Button label="ì£¼ë¬¸ ì·¨ì†Œ ?•ì •" icon="pi pi-trash" onClick={submitCancelOrder} className="p-button-danger" autoFocus />
                    </div>
                </Dialog>

                {/* @ts-ignore */}
                <Dialog header={t('handshake')} visible={partnerModalVisible} style={{ width: '50vw' }} onHide={() => setPartnerModalVisible(false)}>
                    <p className="m-0 mb-3">{t('handshake_desc')}</p>
                    
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-4 border-round h-full flex flex-column align-items-center justify-content-center">
                                <h3 className="m-0 mb-2">?ŒíŠ¸?ˆì‚¬ ?°ë™ ?”ì²­ (?€ë²ˆí˜¸ ë°œê¸‰)</h3>
                                <p className="text-sm text-600 mb-4 text-center">?œì¡°?…ì²´?ê²Œ ?„ë‹¬??1?Œìš© 6?ë¦¬ ?€ë²ˆí˜¸ë¥?ë°œê¸‰ë°›ìŠµ?ˆë‹¤.</p>
                                {generatedPin ? (
                                    <div className="text-center">
                                        <h1 className="text-primary m-0" style={{ fontSize: '3rem', letterSpacing: '0.5rem' }}>{generatedPin}</h1>
                                        <small className="text-500">???€ë²ˆí˜¸ë¥??œì¡°?…ì²´?ê²Œ ?Œë ¤ì£¼ì„¸??</small>
                                    </div>
                                ) : (
                                    <Button label="?€ë²ˆí˜¸ ë°œê¸‰ë°›ê¸°" icon="pi pi-key" onClick={requestHandshake} />
                                )}
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-4 border-round h-full flex flex-column align-items-center justify-content-center">
                                <h3 className="m-0 mb-2">?ŒíŠ¸?ˆì‚¬ ?¸ì¦ (?€ë²ˆí˜¸ ?…ë ¥)</h3>
                                <p className="text-sm text-600 mb-4 text-center">?Œë§¤?…ì²´ë¡œë????„ë‹¬ë°›ì? 6?ë¦¬ ?€ë²ˆí˜¸ë¥??…ë ¥?˜ì—¬ ?°ë™???¹ì¸?©ë‹ˆ??</p>
                                <div className="p-inputgroup">
                                    <InputText placeholder="6?ë¦¬ PIN ?…ë ¥" value={handshakePin} onChange={(e) => setHandshakePin(e.target.value)} maxLength={6} className="text-center text-xl font-bold" />
                                    <Button label="?¸ì¦" icon="pi pi-check" severity="success" onClick={verifyHandshake} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="mt-5 mb-3">?¬ì—…??ì§„ìœ„ ê²€ì¦?/h3>
                    <div className="surface-100 p-4 border-round mb-4">
                        <p className="text-sm text-600 mb-3">?ŒíŠ¸?ˆì‚¬???¬ì—…?ë“±ë¡ë²ˆ??10?ë¦¬)ë¥??…ë ¥?˜ì—¬ êµ?„¸ì²????ì—… ?íƒœë¥?ì¡°íšŒ?©ë‹ˆ??</p>
                        <div className="p-inputgroup mb-3" style={{ maxWidth: '400px' }}>
                            <InputText placeholder="?¬ì—…?ë²ˆ??(?«ìë§?" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} />
                            <Button label="ê²€ì¦í•˜ê¸? icon="pi pi-search" onClick={verifyBusiness} />
                        </div>
                        {businessResult && (
                            <div className={`p-3 border-round ${businessResult.statusCode === '01' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <i className={`pi ${businessResult.statusCode === '01' ? 'pi-check-circle' : 'pi-times-circle'} mr-2`}></i>
                                <strong>[{businessResult.businessNumber}]</strong> {businessResult.statusName} ({businessResult.taxType})
                            </div>
                        )}
                    </div>

                    <h3 className="mt-5 mb-3">???ŒíŠ¸?ˆì‹­ ëª©ë¡</h3>
                    <div className="surface-border border-top-1 pt-3">
                        {handshakes.length === 0 ? (
                            <p className="text-500 text-center py-4">?°ë™???ŒíŠ¸?ˆì‚¬ê°€ ?†ìŠµ?ˆë‹¤.</p>
                        ) : (
                            <div className="flex flex-column gap-2">
                                {handshakes.map(h => (
                                    <div key={h.id} className="flex justify-content-between align-items-center surface-50 p-3 border-round">
                                        <div>
                                            <div className="font-bold">{h.targetCompanyName} <i className="pi pi-arrows-h mx-2 text-400"></i> {h.requesterCompanyName}</div>
                                            <small className="text-500">?”ì²­?? {new Date(h.createdAt).toLocaleString()}</small>
                                        </div>
                                        <div>
                                            <span className={`p-badge ${h.status === 'APPROVED' ? 'p-badge-success' : 'p-badge-warning'}`}>{h.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Dialog>

                {/* @ts-ignore */}
                <Dialog header="?¸ì£¼ ê³µì • ê´€ë¦?ë°?ê¸?ê°ëª¨ ì¶”ì " visible={subcontractModalVisible} style={{ width: '60vw' }} onHide={() => setSubcontractModalVisible(false)}>
                    <div className="flex flex-column gap-4">
                        <div className="surface-100 p-3 border-round">
                            <h3>? ê·œ ?¸ì£¼ ë°˜ì¶œ ê¸°ë¡</h3>
                            <div className="grid">
                                <div className="col-3">
                                    <label>?‘ì—…ëª?(?? ?„ê¸ˆ)</label>
                                    <InputText className="w-full mt-1" value={scForm.taskName} onChange={(e) => setScForm({...scForm, taskName: e.target.value})} />
                                </div>
                                <div className="col-3">
                                    <label>?¸ì£¼?…ì²´ëª?/label>
                                    <InputText className="w-full mt-1" value={scForm.subcontractorName} onChange={(e) => setScForm({...scForm, subcontractorName: e.target.value})} />
                                </div>
                                <div className="col-3">
                                    <label>ë°˜ì¶œ ?¤ì¸¡ ì¤‘ëŸ‰ (g)</label>
                                    <InputNumber className="w-full mt-1" value={scForm.dispatchedWeightG} onValueChange={(e) => setScForm({...scForm, dispatchedWeightG: e.value || 0})} mode="decimal" minFractionDigits={2} />
                                </div>
                                <div className="col-3">
                                    <label>?©ì˜ ?¸ì£¼ê³µì„ (??</label>
                                    <InputNumber className="w-full mt-1" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
                                </div>
                            </div>
                            <Button label="ë°˜ì¶œ ?±ë¡ (Dispatch)" icon="pi pi-upload" onClick={handleDispatchSubcontract} className="mt-3 p-button-success" />
                        </div>

                        <div>
                            <h3>?¸ì£¼ ?´ì—­</h3>
                            {/* @ts-ignore */}
                            <DataTable value={subcontracts} responsiveLayout="scroll">
                                <Column field="taskName" header="?‘ì—…ëª?></Column>
                                <Column field="subcontractorName" header="?¸ì£¼?…ì²´"></Column>
                                <Column field="status" header="?íƒœ" body={(r) => <span className={`p-badge ${r.status === 'RECEIVED' ? 'p-badge-info' : 'p-badge-warning'}`}>{r.status}</span>}></Column>
                                <Column field="dispatchedWeightG" header="ë°˜ì¶œ(g)"></Column>
                                <Column header="ë°˜ì…(g)" body={(r) => {
                                    if (r.status === 'RECEIVED') return <span>{r.receivedWeightG}</span>;
                                    return (
                                        <div className="flex gap-2 align-items-center">
                                            <InputNumber value={receiveForm[r.id]} onValueChange={(e) => setReceiveForm({...receiveForm, [r.id]: e.value || 0})} className="w-5rem" mode="decimal" minFractionDigits={2} />
                                            <Button icon="pi pi-download" onClick={() => handleReceiveSubcontract(r.id)} className="p-button-sm" tooltip="ë°˜ì… ?•ì¸" />
                                        </div>
                                    );
                                }}></Column>
                                <Column header="ê°ëª¨??g)" body={(r) => {
                                    if (r.lossWeightG === null || r.lossWeightG === undefined) return '-';
                                    const percent = ((r.lossWeightG / r.dispatchedWeightG) * 100).toFixed(1);
                                    return <span className={r.lossWeightG > 0 ? "text-red-500 font-bold" : ""}>{r.lossWeightG.toFixed(2)} ({percent}%)</span>;
                                }}></Column>
                                <Column field="agreedLaborFee" header="ê³µì„ë¹???" body={(r) => <span>??r.agreedLaborFee?.toLocaleString()}</span>}></Column>
                            </DataTable>
                        </div>
                    </div>
                </Dialog>
            </div>

            {/* Print Views */}
            {printOrder && printMode === 'label' && (
                <div className="print-mode-label">
                    <h1>{printOrder.orderNo || `KaratFlow #${printOrder.id}`}</h1>
                    <p><strong>Design:</strong> {printOrder.design}</p>
                    <p><strong>Date:</strong> {printOrder.date}</p>
                    {printOrder.engravingText && (
                        <div className="engraving-highlight">
                            ê°ì¸: {printOrder.engravingText} ({printOrder.engravingLocation})
                        </div>
                    )}
                </div>
            )}

            {printOrder && printMode === 'invoice' && (
                <div className="print-mode-invoice">
                    <h1>{printOrder.orderType === 'B2B' ? 'ê±°ë˜ëª…ì„¸??(?„ë§¤??' : '?ˆì§ˆë³´ì¦??(ê³ ê°??'}</h1>
                    
                    <p><strong>ì£¼ë¬¸ë²ˆí˜¸:</strong> {printOrder.orderNo || `KF-${printOrder.id}`}</p>
                    <p><strong>ê³ ê°/?…ì²´ëª?</strong> {printOrder.customerName || 'ì§€?•ë˜ì§€ ?ŠìŒ'}</p>
                    <p><strong>?°ë½ì²?</strong> {printOrder.customerPhone || 'ì§€?•ë˜ì§€ ?ŠìŒ'}</p>
                    <p><strong>ì£¼ë¬¸?¼ì:</strong> {printOrder.date}</p>

                    <table>
                        <thead>
                            <tr>
                                <th>?œí’ˆì½”ë“œ (?”ì??</th>
                                <th>?œë©´ ë§ˆê°</th>
                                <th>ê°ì¸ ?´ìš©</th>
                                {printOrder.orderType === 'B2C' && <th>?Œë¹„?ê?ê²?/th>}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{printOrder.design}</td>
                                <td>{printOrder.surfaceFinish || 'ê¸°ë³¸'}</td>
                                <td>{printOrder.engravingText || '?†ìŒ'}</td>
                                {printOrder.orderType === 'B2C' && <td>{printOrder.finalConsumerPrice ? printOrder.finalConsumerPrice.toLocaleString() + '?? : 'ë³„ë„ ë¬¸ì˜'}</td>}
                            </tr>
                        </tbody>
                    </table>

                    {printOrder.invoice && printOrder.orderType === 'B2B' && (
                        <div style={{ marginTop: '20mm', border: '1px solid #000', padding: '10px' }}>
                            <h3>?•ì‚° ?ì„¸ (B2B ?„ìš©)</h3>
                            <p><strong>?ìš© ê¸??œì„¸:</strong> ??printOrder.invoice.goldPricePer375g?.toLocaleString()} (ê¸°ì??? {printOrder.invoice.priceDate})</p>
                            <p><strong>ì¶œê³  ?¤ì¸¡ ì¤‘ëŸ‰:</strong> {printOrder.invoice.completedWeightG}g / <strong>?¤í†¤ ì¤‘ëŸ‰:</strong> {printOrder.invoice.stoneWeightG}g</p>
                            <p><strong>?•ì‚° ê¸°ì? ì¤‘ëŸ‰ (?´ë¦¬??{printOrder.invoice.lossRatePercent}%):</strong> {printOrder.invoice.settlementBaseWeightG?.toFixed(3)}g</p>
                            <p><strong>ê¸?ì²?µ¬??</strong> ??printOrder.invoice.calculatedGoldPrice?.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                            <p><strong>?ì²­ ê³µì„:</strong> ??printOrder.invoice.baseLaborFee?.toLocaleString()}</p>
                            <p><strong>?¤í†¤ë¹?</strong> ??printOrder.invoice.stoneFee?.toLocaleString()}</p>
                            <h2 style={{ marginTop: '10px', color: '#b91c1c' }}>ìµœì¢… ì²?µ¬?? ??printOrder.invoice.finalBillingAmount?.toLocaleString(undefined, {maximumFractionDigits:0})}</h2>
                        </div>
                    )}
                    
                    {printOrder.orderType === 'B2B' && (
                        <div style={{ marginTop: '30mm' }}>
                            <p>??ê¸ˆì•¡???ìˆ˜?? (ê³µê¸‰???œëª…: _______________ )</p>
                        </div>
                    )}
                    
                    {printOrder.orderType === 'B2C' && (
                        <div style={{ marginTop: '30mm', textAlign: 'center' }}>
                            <p>ë³??œí’ˆ?€ ?„ê²©???ˆì§ˆê´€ë¦¬ë? ê±°ì³ ?œì‘?˜ì—ˆ?Œì„ ë³´ì¦?©ë‹ˆ??</p>
                            <p><strong>KaratFlow Jewelry</strong></p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default App;
