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
        surfaceFinish: '유광',
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

    const openHandshakeModal = () => {
        fetch('http://localhost:8888/api/handshake')
            .then(res => res.json())
            .then(data => {
                setHandshakes(data);
                setPartnerModalVisible(true);
            });
    };

    const requestHandshake = () => {
        fetch('http://localhost:8888/api/handshake/request', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                setGeneratedPin(data.pinCode);
                setHandshakes([...handshakes, data]);
                toast.current?.show({ severity: 'success', summary: '발급 완료', detail: '파트너사 연동 PIN이 발급되었습니다.', life: 5000 });
            });
    };

    const submitCreateOrder = () => {
        fetch('http://localhost:8888/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createOrderForm)
        })
        .then(res => res.json())
        .then(newOrder => {
            fetchOrders();
            setCreateOrderModalVisible(false);
            setCreateOrderForm({ orderType: 'B2C', customerName: '', customerPhone: '', designId: 1, engravingText: '', engravingLocation: '', surfaceFinish: '유광', finalConsumerPrice: 0 });
            toast.current?.show({ severity: 'success', summary: '주문 생성 완료', detail: '새로운 주문이 시스템에 등록되었습니다.', life: 3000 });
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
            toast.current?.show({ severity: 'success', summary: '인증 완료', detail: '파트너사 연동이 승인되었습니다.', life: 5000 });
            setHandshakePin('');
        })
        .catch(() => {
            toast.current?.show({ severity: 'error', summary: '인증 실패', detail: '유효하지 않거나 만료된 PIN입니다.', life: 3000 });
        });
    };

    const verifyBusiness = () => {
        if (!businessNumber) return;
        fetch('http://localhost:8888/api/business/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessNumber })
        })
        .then(res => res.json())
        .then(data => {
            setBusinessResult(data);
            if (data.statusCode === '01') {
                toast.current?.show({ severity: 'success', summary: '조회 성공', detail: '정상 영업 중인 사업자입니다.', life: 3000 });
            } else {
                toast.current?.show({ severity: 'warn', summary: '주의', detail: '계속사업자가 아닙니다 (' + data.statusName + ')', life: 5000 });
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
            toast.current?.show({ severity: 'success', summary: '외주 등록', detail: '외주 반출이 기록되었습니다.', life: 3000 });
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
            toast.current?.show({ severity: 'info', summary: '반입 완료', detail: `감모량: ${updatedTask.lossWeightG}g`, life: 5000 });
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
                toast.current?.show({ severity: 'success', summary: '주문 취소 완료', detail: `수수료: ₩${data.cancellationFee}`, life: 5000 });
                setCancelModalVisible(false);
                fetchOrders();
            });
    };

    const advanceStage = (orderId: number) => {
        fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'error') {
                    toast.current?.show({ severity: 'error', summary: '오류', detail: data.message, life: 3000 });
                } else {
                    toast.current?.show({ severity: 'info', summary: '공정 이동', detail: `주문 #${orderId} 공정이 [${data.newStage}] 단계로 이동했습니다.`, life: 3000 });
                    fetchOrders();
                }
            })
            .catch(err => {
                toast.current?.show({ severity: 'error', summary: '오류', detail: '공정 단계 이동 중 오류가 발생했습니다.', life: 3000 });
            });
    };

    const fetchOrders = () => {
        fetch('http://localhost:8888/api/orders')
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error('Error fetching orders:', err));
            
        fetch('http://localhost:8888/api/orders/stats')
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
                    <span className="p-badge p-badge-secondary">취소됨</span>
                    {rowData.cancellationFee > 0 && <small className="text-red-500 font-bold">위약금: ₩{rowData.cancellationFee.toLocaleString()}</small>}
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
        if (rowData.status === 'CANCELLED') return <span className="text-400">액션 없음</span>;
        
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-forward" tooltip="공정 이동" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-rounded p-button-success p-button-text" />
                <Button icon="pi pi-truck" tooltip="외주 감모 추적" onClick={() => openSubcontractModal(rowData.id)} className="p-button-rounded p-button-secondary p-button-text" />
                <Button icon="pi pi-print" tooltip="라벨 인쇄" onClick={() => handlePrint(rowData, 'label')} className="p-button-rounded p-button-success p-button-text" />
                <Button icon="pi pi-file-pdf" tooltip="명세서 인쇄" onClick={() => handlePrint(rowData, 'invoice')} className="p-button-rounded p-button-info p-button-text" />
                <Button icon="pi pi-pencil" tooltip="변경 요청" onClick={() => { setSelectedOrderId(rowData.id); setChangeModalVisible(true); }} className="p-button-rounded p-button-warning p-button-text" />
                <Button icon="pi pi-trash" tooltip="주문 취소" onClick={() => openCancelModal(rowData.id)} className="p-button-rounded p-button-danger p-button-text" />
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
                        <Button label="새 주문 생성" icon="pi pi-plus" className="p-button-primary" onClick={() => setCreateOrderModalVisible(true)} />
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
                                <Column field="orderNo" header="주문 번호" />
                                <Column field="id" header="ID" />
                                <Column field="design" header="Design Code" />
                                <Column field="customerName" header="고객명" />
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
                <Dialog header="새 주문 생성" visible={createOrderModalVisible} style={{ width: '50vw' }} onHide={() => setCreateOrderModalVisible(false)}>
                    <div className="flex flex-column gap-3 p-fluid">
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">구분</span>
                            <InputText value={createOrderForm.orderType} onChange={(e) => setCreateOrderForm({...createOrderForm, orderType: e.target.value})} placeholder="B2C, B2B 등" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">고객명</span>
                            <InputText value={createOrderForm.customerName} onChange={(e) => setCreateOrderForm({...createOrderForm, customerName: e.target.value})} placeholder="고객 이름" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">연락처</span>
                            <InputText value={createOrderForm.customerPhone} onChange={(e) => setCreateOrderForm({...createOrderForm, customerPhone: e.target.value})} placeholder="010-0000-0000" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">각인 문구</span>
                            <InputText value={createOrderForm.engravingText} onChange={(e) => setCreateOrderForm({...createOrderForm, engravingText: e.target.value})} placeholder="각인할 텍스트 (옵션)" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">각인 위치</span>
                            <InputText value={createOrderForm.engravingLocation} onChange={(e) => setCreateOrderForm({...createOrderForm, engravingLocation: e.target.value})} placeholder="반지 안쪽 등 (옵션)" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">표면 처리</span>
                            <InputText value={createOrderForm.surfaceFinish} onChange={(e) => setCreateOrderForm({...createOrderForm, surfaceFinish: e.target.value})} placeholder="유광/무광" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">소비자가(₩)</span>
                            <InputNumber value={createOrderForm.finalConsumerPrice} onValueChange={(e) => setCreateOrderForm({...createOrderForm, finalConsumerPrice: e.value || 0})} mode="currency" currency="KRW" locale="ko-KR" />
                        </div>
                    </div>
                    <div className="flex justify-content-end mt-4">
                        <Button label="취소" icon="pi pi-times" onClick={() => setCreateOrderModalVisible(false)} className="p-button-text p-button-secondary mr-2" />
                        <Button label="주문 등록" icon="pi pi-check" onClick={submitCreateOrder} className="p-button-primary" autoFocus />
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
                <Dialog header="주문 취소 및 위약금 확인" visible={cancelModalVisible} style={{ width: '40vw' }} onHide={() => setCancelModalVisible(false)}>
                    <div className="flex flex-column align-items-center justify-content-center text-center p-4">
                        <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '3rem' }}></i>
                        <h2 className="mt-3">주문을 정말 취소하시겠습니까?</h2>
                        <p className="m-0 mb-4 text-600">
                            현재 공정 진행 상태에 따라 위약금이 부과됩니다.<br/>
                            한 번 취소된 주문은 복구할 수 없습니다.
                        </p>
                        
                        <div className="surface-100 p-4 border-round w-full">
                            <h3 className="m-0 mb-2">예상 위약금 (취소 수수료)</h3>
                            <h2 className="m-0 text-red-500">₩{cancelEstimate?.toLocaleString()}</h2>
                        </div>
                    </div>
                    <div className="flex justify-content-end mt-4">
                        <Button label="돌아가기" icon="pi pi-times" onClick={() => setCancelModalVisible(false)} className="p-button-text p-button-secondary" />
                        <Button label="주문 취소 확정" icon="pi pi-trash" onClick={submitCancelOrder} className="p-button-danger" autoFocus />
                    </div>
                </Dialog>

                {/* @ts-ignore */}
                <Dialog header={t('handshake')} visible={partnerModalVisible} style={{ width: '50vw' }} onHide={() => setPartnerModalVisible(false)}>
                    <p className="m-0 mb-3">{t('handshake_desc')}</p>
                    
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-4 border-round h-full flex flex-column align-items-center justify-content-center">
                                <h3 className="m-0 mb-2">파트너사 연동 요청 (핀번호 발급)</h3>
                                <p className="text-sm text-600 mb-4 text-center">제조업체에게 전달할 1회용 6자리 핀번호를 발급받습니다.</p>
                                {generatedPin ? (
                                    <div className="text-center">
                                        <h1 className="text-primary m-0" style={{ fontSize: '3rem', letterSpacing: '0.5rem' }}>{generatedPin}</h1>
                                        <small className="text-500">이 핀번호를 제조업체에게 알려주세요.</small>
                                    </div>
                                ) : (
                                    <Button label="핀번호 발급받기" icon="pi pi-key" onClick={requestHandshake} />
                                )}
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-4 border-round h-full flex flex-column align-items-center justify-content-center">
                                <h3 className="m-0 mb-2">파트너사 인증 (핀번호 입력)</h3>
                                <p className="text-sm text-600 mb-4 text-center">소매업체로부터 전달받은 6자리 핀번호를 입력하여 연동을 승인합니다.</p>
                                <div className="p-inputgroup">
                                    <InputText placeholder="6자리 PIN 입력" value={handshakePin} onChange={(e) => setHandshakePin(e.target.value)} maxLength={6} className="text-center text-xl font-bold" />
                                    <Button label="인증" icon="pi pi-check" severity="success" onClick={verifyHandshake} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="mt-5 mb-3">사업자 진위 검증</h3>
                    <div className="surface-100 p-4 border-round mb-4">
                        <p className="text-sm text-600 mb-3">파트너사의 사업자등록번호(10자리)를 입력하여 국세청 휴/폐업 상태를 조회합니다.</p>
                        <div className="p-inputgroup mb-3" style={{ maxWidth: '400px' }}>
                            <InputText placeholder="사업자번호 (숫자만)" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} />
                            <Button label="검증하기" icon="pi pi-search" onClick={verifyBusiness} />
                        </div>
                        {businessResult && (
                            <div className={`p-3 border-round ${businessResult.statusCode === '01' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <i className={`pi ${businessResult.statusCode === '01' ? 'pi-check-circle' : 'pi-times-circle'} mr-2`}></i>
                                <strong>[{businessResult.businessNumber}]</strong> {businessResult.statusName} ({businessResult.taxType})
                            </div>
                        )}
                    </div>

                    <h3 className="mt-5 mb-3">내 파트너십 목록</h3>
                    <div className="surface-border border-top-1 pt-3">
                        {handshakes.length === 0 ? (
                            <p className="text-500 text-center py-4">연동된 파트너사가 없습니다.</p>
                        ) : (
                            <div className="flex flex-column gap-2">
                                {handshakes.map(h => (
                                    <div key={h.id} className="flex justify-content-between align-items-center surface-50 p-3 border-round">
                                        <div>
                                            <div className="font-bold">{h.targetCompanyName} <i className="pi pi-arrows-h mx-2 text-400"></i> {h.requesterCompanyName}</div>
                                            <small className="text-500">요청일: {new Date(h.createdAt).toLocaleString()}</small>
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
                <Dialog header="외주 공정 관리 및 금 감모 추적" visible={subcontractModalVisible} style={{ width: '60vw' }} onHide={() => setSubcontractModalVisible(false)}>
                    <div className="flex flex-column gap-4">
                        <div className="surface-100 p-3 border-round">
                            <h3>신규 외주 반출 기록</h3>
                            <div className="grid">
                                <div className="col-3">
                                    <label>작업명 (예: 도금)</label>
                                    <InputText className="w-full mt-1" value={scForm.taskName} onChange={(e) => setScForm({...scForm, taskName: e.target.value})} />
                                </div>
                                <div className="col-3">
                                    <label>외주업체명</label>
                                    <InputText className="w-full mt-1" value={scForm.subcontractorName} onChange={(e) => setScForm({...scForm, subcontractorName: e.target.value})} />
                                </div>
                                <div className="col-3">
                                    <label>반출 실측 중량 (g)</label>
                                    <InputNumber className="w-full mt-1" value={scForm.dispatchedWeightG} onValueChange={(e) => setScForm({...scForm, dispatchedWeightG: e.value || 0})} mode="decimal" minFractionDigits={2} />
                                </div>
                                <div className="col-3">
                                    <label>합의 외주공임 (원)</label>
                                    <InputNumber className="w-full mt-1" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
                                </div>
                            </div>
                            <Button label="반출 등록 (Dispatch)" icon="pi pi-upload" onClick={handleDispatchSubcontract} className="mt-3 p-button-success" />
                        </div>

                        <div>
                            <h3>외주 내역</h3>
                            {/* @ts-ignore */}
                            <DataTable value={subcontracts} responsiveLayout="scroll">
                                <Column field="taskName" header="작업명"></Column>
                                <Column field="subcontractorName" header="외주업체"></Column>
                                <Column field="status" header="상태" body={(r) => <span className={`p-badge ${r.status === 'RECEIVED' ? 'p-badge-info' : 'p-badge-warning'}`}>{r.status}</span>}></Column>
                                <Column field="dispatchedWeightG" header="반출(g)"></Column>
                                <Column header="반입(g)" body={(r) => {
                                    if (r.status === 'RECEIVED') return <span>{r.receivedWeightG}</span>;
                                    return (
                                        <div className="flex gap-2 align-items-center">
                                            <InputNumber value={receiveForm[r.id]} onValueChange={(e) => setReceiveForm({...receiveForm, [r.id]: e.value || 0})} className="w-5rem" mode="decimal" minFractionDigits={2} />
                                            <Button icon="pi pi-download" onClick={() => handleReceiveSubcontract(r.id)} className="p-button-sm" tooltip="반입 확인" />
                                        </div>
                                    );
                                }}></Column>
                                <Column header="감모량(g)" body={(r) => {
                                    if (r.lossWeightG === null || r.lossWeightG === undefined) return '-';
                                    const percent = ((r.lossWeightG / r.dispatchedWeightG) * 100).toFixed(1);
                                    return <span className={r.lossWeightG > 0 ? "text-red-500 font-bold" : ""}>{r.lossWeightG.toFixed(2)} ({percent}%)</span>;
                                }}></Column>
                                <Column field="agreedLaborFee" header="공임비(원)" body={(r) => <span>₩{r.agreedLaborFee?.toLocaleString()}</span>}></Column>
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
                            각인: {printOrder.engravingText} ({printOrder.engravingLocation})
                        </div>
                    )}
                </div>
            )}

            {printOrder && printMode === 'invoice' && (
                <div className="print-mode-invoice">
                    <h1>{printOrder.orderType === 'B2B' ? '거래명세표 (도매용)' : '품질보증서 (고객용)'}</h1>
                    
                    <p><strong>주문번호:</strong> {printOrder.orderNo || `KF-${printOrder.id}`}</p>
                    <p><strong>고객/업체명:</strong> {printOrder.customerName || '지정되지 않음'}</p>
                    <p><strong>연락처:</strong> {printOrder.customerPhone || '지정되지 않음'}</p>
                    <p><strong>주문일자:</strong> {printOrder.date}</p>

                    <table>
                        <thead>
                            <tr>
                                <th>제품코드 (디자인)</th>
                                <th>표면 마감</th>
                                <th>각인 내용</th>
                                {printOrder.orderType === 'B2C' && <th>소비자가격</th>}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{printOrder.design}</td>
                                <td>{printOrder.surfaceFinish || '기본'}</td>
                                <td>{printOrder.engravingText || '없음'}</td>
                                {printOrder.orderType === 'B2C' && <td>{printOrder.finalConsumerPrice ? printOrder.finalConsumerPrice.toLocaleString() + '원' : '별도 문의'}</td>}
                            </tr>
                        </tbody>
                    </table>

                    {printOrder.invoice && printOrder.orderType === 'B2B' && (
                        <div style={{ marginTop: '20mm', border: '1px solid #000', padding: '10px' }}>
                            <h3>정산 상세 (B2B 전용)</h3>
                            <p><strong>적용 금 시세:</strong> ₩{printOrder.invoice.goldPricePer375g?.toLocaleString()} (기준일: {printOrder.invoice.priceDate})</p>
                            <p><strong>출고 실측 중량:</strong> {printOrder.invoice.completedWeightG}g / <strong>스톤 중량:</strong> {printOrder.invoice.stoneWeightG}g</p>
                            <p><strong>정산 기준 중량 (해리율 {printOrder.invoice.lossRatePercent}%):</strong> {printOrder.invoice.settlementBaseWeightG?.toFixed(3)}g</p>
                            <p><strong>금 청구액:</strong> ₩{printOrder.invoice.calculatedGoldPrice?.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                            <p><strong>원청 공임:</strong> ₩{printOrder.invoice.baseLaborFee?.toLocaleString()}</p>
                            <p><strong>스톤비:</strong> ₩{printOrder.invoice.stoneFee?.toLocaleString()}</p>
                            <h2 style={{ marginTop: '10px', color: '#b91c1c' }}>최종 청구액: ₩{printOrder.invoice.finalBillingAmount?.toLocaleString(undefined, {maximumFractionDigits:0})}</h2>
                        </div>
                    )}
                    
                    {printOrder.orderType === 'B2B' && (
                        <div style={{ marginTop: '30mm' }}>
                            <p>위 금액을 영수함. (공급자 서명: _______________ )</p>
                        </div>
                    )}
                    
                    {printOrder.orderType === 'B2C' && (
                        <div style={{ marginTop: '30mm', textAlign: 'center' }}>
                            <p>본 제품은 엄격한 품질관리를 거쳐 제작되었음을 보증합니다.</p>
                            <p><strong>KaratFlow Jewelry</strong></p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default App;
