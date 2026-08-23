import { Tag } from 'primereact/tag';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Client } from '@stomp/stompjs';
import i18n from './i18n';

function App() {
    const { t } = useTranslation();
    const toast = useRef<any>(null);
    const [changeModalVisible, setChangeModalVisible] = useState(false);
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [partnerModalVisible, setPartnerModalVisible] = useState(false);
    const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);
    const [orderDetailVisible, setOrderDetailVisible] = useState(false);
    
    const [_liveEvents, _setLiveEvents] = useState<{id: number, message: string, time: string}[]>([]);
    const [_dashboardStats, setDashboardStats] = useState({
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
                toast.current?.show({ severity: 'success', summary: '발급 완료', detail: '파트너사 연동 PIN이 발급되었습니다.', life: 5000 });
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
            setCreateOrderForm({ orderType: 'B2C', customerName: '', customerPhone: '', designId: 1, engravingText: '', engravingLocation: '', surfaceFinish: '유광', finalConsumerPrice: 0 });
            toast.current?.show({ severity: 'success', summary: '주문 생성 완료', detail: '새로운 주문이 시스템에 등록되었습니다.', life: 3000 });
        });
    };

    const verifyHandshake = () => {
        fetch('http://localhost:8888/api/handshake/verify', {
            method: 'POST',
            headers: getAuthHeaders(),
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
            headers: getAuthHeaders(),
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
        fetch(`http://localhost:8888/api/orders/${orderId}/subcontracts`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setSubcontracts(data);
                setSubcontractModalVisible(true);
            });
    };

    const handleDispatchSubcontract = () => {
        fetch(`http://localhost:8888/api/orders/${selectedOrderId}/subcontracts/dispatch`, {
            method: 'POST',
            headers: getAuthHeaders(),
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
        fetch(`http://localhost:8888/api/orders/${orderId}/cancel-estimate`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setCancelEstimate(data.estimatedFee);
                setCancelModalVisible(true);
            });
    };

    const submitCancelOrder = () => {
        if (!selectedOrderId) return;
        fetch(`http://localhost:8888/api/orders/${selectedOrderId}/cancel`, { method: 'POST', headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                toast.current?.show({ severity: 'success', summary: '주문 취소 완료', detail: `수수료: ₩${data.cancellationFee}`, life: 5000 });
                setCancelModalVisible(false);
                fetchOrders();
            });
    };

    const advanceStage = (orderId: number) => {
        fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST', headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'error') {
                    toast.current?.show({ severity: 'error', summary: '오류', detail: data.message, life: 3000 });
                } else {
                    toast.current?.show({ severity: 'info', summary: '공정 이동', detail: `주문 #${orderId} 공정이 [${data.newStage}] 단계로 이동했습니다.`, life: 3000 });
                    fetchOrders();
                }
            })
            .catch((_err) => {
                toast.current?.show({ severity: 'error', summary: '오류', detail: '공정 단계 이동 중 오류가 발생했습니다.', life: 3000 });
            });
    };

    const fetchOrders = () => {
        fetch('http://localhost:8888/api/orders', { headers: getAuthHeaders() })
            .then(res => {
                if (res.status === 401 || res.redirected || (res.url && res.url.includes('/login'))) {
                    navigate('/login');
                    throw new Error('Unauthorized');
                }
                return res.text();
            })
            .then(text => {
                if (text.trim().startsWith('<')) {
                    navigate('/login');
                    throw new Error('Unauthorized html');
                }
                return JSON.parse(text);
            })
            .then(data => {
                const mappedData = data.map((o: any) => {
                    let s = o.stage;
                    if (s) s = s.toUpperCase();
                    if (s === 'PENDING') s = '접수';
                    else if (s === 'CAD') s = 'CAD';
                    else if (s === 'CASTING' || s === '주물') s = '주물';
                    else if (s === 'POLISHING' || s === '세공') s = '세공';
                    else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '완성';
                    return { ...o, stage: s };
                });
                setOrders(mappedData);
            })
            .catch((_err) => console.error('Error fetching orders:', _err));
            
        fetch('http://localhost:8888/api/orders/stats', { headers: getAuthHeaders() })
            .then(res => {
                if (res.status === 401 || res.redirected || (res.url && res.url.includes('/login'))) {
                    throw new Error('Unauthorized');
                }
                return res.text();
            })
            .then(text => {
                if (text.trim().startsWith('<')) {
                    throw new Error('Unauthorized html');
                }
                return JSON.parse(text);
            })
            .then(data => setDashboardStats(data))
            .catch((_err) => console.error('Error fetching stats:', _err));
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
                            severity: 'info', 
                            summary: 'Live Event', 
                            detail: payload.message, 
                            life: 5000 
                        });
                        _setLiveEvents(prev => [{
                            id: Date.now(), 
                            message: payload.message, 
                            time: new Date().toLocaleTimeString()
                        }, ...prev].slice(0, 50));
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
        fetch(`http://localhost:8888/api/orders/${selectedOrderId}/hold`, { method: 'POST', headers: getAuthHeaders() })
            .then(() => {
                setChangeModalVisible(false);
            });
    };

    
    const showHoldAlert = () => {
        // Fallback for simulate button if needed
        toast.current?.show({ severity: 'warn', summary: t('alert_title'), detail: t('alert_desc'), life: 3000 });
    };

    const statusBodyTemplate = (rowData: any) => {
        if (rowData.status === 'CANCELLED') {
            return (
                <div className="flex flex-column gap-1">
                    <span className="p-badge p-badge-secondary">취소됨</span>
                    {rowData.cancellationFee > 0 && <small className="text-red-500 font-bold">위약금 ₩{rowData.cancellationFee.toLocaleString()}</small>}
                </div>
            );
        }
        
        const stageMap: Record<string, { label: string, severity: 'success' | 'info' | 'warning' | 'danger' | null }> = {
            '접수': { label: '접수', severity: null },
            'CAD': { label: 'CAD', severity: 'info' },
            '주물': { label: '주물', severity: 'warning' },
            '세공': { label: '세공', severity: 'danger' },
            '완성': { label: '완성', severity: 'success' }
        };
        
        let s = rowData.stage;
        if (s) s = s.toUpperCase();
        
        if (!stageMap[s]) {
            if (s === 'PENDING') s = '접수';
            else if (s === 'CAD') s = 'CAD';
            else if (s === 'CASTING' || s === '주물') s = '주물';
            else if (s === 'POLISHING' || s === '세공') s = '세공';
            else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';
            else s = '접수';
        }
        
        const mapped = stageMap[s] || { label: s, severity: null };
        
        return (
            <Tag severity={mapped.severity} value={mapped.label} rounded></Tag>
        );
    };

    const toggleLanguage = () => {
        const currentLang = i18n.language || window.localStorage.getItem('i18nextLng') || 'ko';
        const nextLang = currentLang.startsWith('ko') ? 'en' : 'ko';
        i18n.changeLanguage(nextLang);
    };

    
    
    const handlePrint = async (order: any, mode: 'label' | 'invoice') => {
        if (mode === 'invoice') {
            try {
                const res = await fetch(`http://localhost:8888/api/orders/${order.id}/invoice`, { headers: getAuthHeaders() });
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

    
    

    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 주물: 4.5, 세공: 8.2 },
        { date: '08/18', CAD: 2.4, 주물: 4.2, 세공: 9.1 },
        { date: '08/19', CAD: 1.8, 주물: 5.0, 세공: 12.5 }, 
        { date: '08/20', CAD: 2.5, 주물: 4.1, 세공: 10.8 },
        { date: '08/21', CAD: 2.0, 주물: 4.8, 세공: 8.5 },
        { date: '08/22', CAD: 2.2, 주물: 4.4, 세공: 8.0 },
        { date: '08/23', CAD: 1.9, 주물: 4.0, 세공: 7.5 }
    ];
    
    const dailySubcontractData = [
        { date: '08/17', 제일도금: 24, 성실주물: 12 },
        { date: '08/18', 제일도금: 22, 성실주물: 14 },
        { date: '08/19', 제일도금: 28, 성실주물: 11 },
        { date: '08/20', 제일도금: 25, 성실주물: 16 },
        { date: '08/21', 제일도금: 20, 성실주물: 13 },
        { date: '08/22', 제일도금: 18, 성실주물: 10 },
        { date: '08/23', 제일도금: 21, 성실주물: 12 }
    ];
    return (
        <>
            <Toast ref={toast} />
            <div className="flex flex-column h-screen surface-ground no-print">
                {/* APM Header */}
                <div className="flex justify-content-between align-items-center px-4 py-3 surface-0 border-bottom-1 border-300 shadow-2">
                    <div className="flex align-items-center gap-3">
                        <div className="w-2rem h-2rem bg-primary border-circle flex align-items-center justify-content-center shadow-1">
                            <i className="pi pi-chart-line text-white"></i>
                        </div>
                        <h2 className="m-0 text-xl font-bold text-900 tracking-tight">KaratFlow Gemini <span className="text-500 font-normal text-lg ml-2">통합 모니터링 대시보드</span></h2>
                    </div>
                    <div className="flex gap-2">
                        <Button label="새 주문 생성" icon="pi pi-plus" className="p-button-primary p-button-sm shadow-1" onClick={() => setCreateOrderModalVisible(true)} />
                        <Button label={t('lang')} icon="pi pi-globe" className="p-button-text p-button-secondary p-button-sm text-700" onClick={toggleLanguage} />
                        <Button label="협력사 초대" icon="pi pi-users" className="p-button-outlined p-button-info p-button-sm" onClick={openHandshakeModal} />
                        <Button label="보류 알림 시뮬레이션" icon="pi pi-bell" className="p-button-warning p-button-sm shadow-1" onClick={showHoldAlert} />
                        
                        <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                            <div className="w-2rem h-2rem border-circle bg-primary flex align-items-center justify-content-center text-white font-bold text-sm">
                                <i className="pi pi-user"></i>
                            </div>
                            <span className="text-700 font-bold text-sm">로그인됨</span>
                            <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger ml-2" aria-label="Logout" tooltip="로그아웃" tooltipOptions={{position: 'bottom'}} onClick={() => { localStorage.removeItem('jwtToken'); window.location.href = '/login'; }} />
                        </div>
                    </div>
                </div>

                {/* APM Main Content */}
                <div className="flex-1 flex overflow-hidden p-3 gap-3">
                    {/* Left Panel: Metrics & Charts */}
                    <div className="flex flex-column gap-3" style={{ width: '450px' }}>
                        <div className="surface-0 p-3 border-round shadow-1">
                            <h4 className="m-0 mb-3 text-600 font-medium">실시간 핵심 지표</h4>
                            <div className="flex justify-content-between align-items-end mb-3">
                                <span className="text-600">진행중 주문</span>
                                <span className="text-3xl font-bold text-900">{orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'COMPLETED').length} <small className="text-sm font-normal text-gray-500">건</small></span>
                            </div>
                            <div className="flex justify-content-between align-items-end mb-3">
                                <span className="text-600">금일 완료</span>
                                <span className="text-3xl font-bold text-green-400">{orders.filter(o => o.status === 'COMPLETED').length} <small className="text-sm font-normal text-gray-500">건</small></span>
                            </div>
                        </div>
                        
                        
                        {/* Advanced Chart 1: 병목 분석 */}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                            <h4 className="m-0 mb-3 text-600 font-medium">작업장 공정 트렌드 현황 (주간)</h4>
                            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyProcessData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="CAD" stackId="a" fill="#8884d8" name="CAD" />
                                        <Bar dataKey="주물" stackId="a" fill="#82ca9d" name="주물" />
                                        <Bar dataKey="세공" stackId="a" fill="#ffc658" name="세공" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Advanced Chart 2: 외주 처리 현황 */}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                            <h4 className="m-0 mb-3 text-600 font-medium">외주 협력업체 처리 시간 추이 (주간)</h4>
                            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailySubcontractData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Line type="monotone" dataKey="제일도금" stroke="#8884d8" strokeWidth={3} dot={{r: 4}} />
                                        <Line type="monotone" dataKey="성실주물" stroke="#82ca9d" strokeWidth={3} dot={{r: 4}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Pipeline & Data Table */}
                    <div className="flex-1 flex flex-column gap-3 overflow-hidden">
                        
                        {/* Pipeline Visualizer */}
                        <div className="surface-0 p-3 border-round shadow-1">
                            <h4 className="m-0 mb-4 text-600 font-medium">실시간 공정 현황 (Pipeline)</h4>
                            <div className="flex justify-content-between align-items-center px-4 relative">
                                {/* Connecting Line */}
                                <div className="absolute w-full z-0" style={{ height: '4px', backgroundColor: '#e5e7eb', top: '30px', left: '0' }}></div>
                                
                                {['접수', 'CAD', '주물', '세공', '완성'].map(stage => ({
                                    name: stage,
                                    count: orders.filter(o => o.stage === stage).length
                                })).map((s) => {
                                    const stageColors: Record<string, {bg: string, border: string, text: string, bgHex: string, borderHex: string}> = {
                                          '접수': { bg: '', border: '', text: 'text-white', bgHex: '#64748B', borderHex: '#475569' },
                                          'CAD': { bg: '', border: '', text: 'text-white', bgHex: '#3B82F6', borderHex: '#2563EB' },
                                          '주물': { bg: '', border: '', text: 'text-white', bgHex: '#F59E0B', borderHex: '#D97706' },
                                          '세공': { bg: '', border: '', text: 'text-white', bgHex: '#EF4444', borderHex: '#DC2626' },
                                          '완성': { bg: '', border: '', text: 'text-white', bgHex: '#22C55E', borderHex: '#16A34A' }
                                      };
                                    const color = stageColors[s.name] || stageColors['접수'];
                                    
                                    return (
                                        <div key={s.name} className="flex flex-column align-items-center z-1 relative bg-white" style={{ borderRadius: '50%' }}>
                                            <div className={`flex align-items-center justify-content-center border-circle border-2 mb-2 shadow-1`} style={{ width: '60px', height: '60px', backgroundColor: color.bgHex, borderColor: color.borderHex }}>
                                                <span className={`text-2xl font-bold ${color.text}`}>{s.count}</span>
                                            </div>
                                            <span className="text-700 font-medium bg-white px-2">{s.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Enhanced Data Table */}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column overflow-hidden">
                            <h4 className="m-0 mb-3 text-600 font-medium">상세 주문 모니터링</h4>
                            <div className="flex-1 overflow-auto custom-dark-table pb-3">
                                {/* @ts-ignore */}
                                <DataTable value={orders} size="small" paginator rows={10} selectionMode="single" selection={selectedOrderId === null ? null : orders.find(o => o.id === selectedOrderId)} onSelectionChange={(e) => { setSelectedOrderId(e.value?.id); if(e.value) setOrderDetailVisible(true); }} dataKey="id" emptyMessage="등록된 주문이 없습니다." className="p-datatable-sm cursor-pointer" rowClassName={() => 'surface-0 text-900 hover:surface-50 transition-colors transition-duration-200'}>
                                    <Column header="주문 번호" body={(r) => <span className="font-bold text-primary">#{r.orderNo || r.id}</span>} style={{ minWidth: '120px' }} />
                                    <Column field="design" header="Design" />
                                    <Column field="customerName" header="고객명" />
                                    <Column field="stage" header="공정 상태" body={statusBodyTemplate}></Column>
                                    <Column header="" body={(rowData) => <Button icon="pi pi-eye" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(rowData.id); setOrderDetailVisible(true); }} className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions={{position: 'left'}} />} style={{ width: '60px' }} />
                                </DataTable>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Live Feed */}
                    <div className="surface-0 p-3 border-round shadow-1 flex flex-column" style={{ width: '350px' }}>
                        <div className="flex justify-content-between align-items-center mb-3">
                            <h4 className="m-0 text-600 font-medium">Live Event Feed</h4>
                            <span className="flex align-items-center gap-2">
                                <span className="w-1rem h-1rem bg-green-500 border-circle inline-block" style={{ animation: 'pulse 2s infinite' }}></span>
                                <span className="text-sm text-green-500 font-bold">LIVE</span>
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {_liveEvents.length === 0 ? (
                                <div className="text-center text-gray-500 py-4 mt-5">최근 발생한 이벤트가 없습니다.</div>
                            ) : (
                                _liveEvents.map(ev => (
                                    <div key={ev.id} className="surface-50 p-3 border-round border-left-3 border-primary shadow-1 fadein animation-duration-300">
                                        <div className="flex justify-content-between align-items-center mb-1">
                                            <span className="text-xs text-600"><i className="pi pi-clock mr-1"></i> {ev.time}</span>
                                        </div>
                                        <div className="text-sm text-900 line-height-3">{ev.message}</div>
                                    </div>
                                ))
                            )}
                        </div>
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
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>외주업체명</label>
                                    <InputText className="w-full" value={scForm.subcontractorName} onChange={(e) => setScForm({...scForm, subcontractorName: e.target.value})} />
                                </div>
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>반출 실측 중량 (g)</label>
                                    <InputNumber className="w-full" value={scForm.dispatchedWeightG} onValueChange={(e) => setScForm({...scForm, dispatchedWeightG: e.value || 0})} mode="decimal" minFractionDigits={2} />
                                </div>
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>합의 외주공임 (원)</label>
                                    <InputNumber className="w-full" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
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


            <Dialog header="주문 상세 정보" visible={orderDetailVisible} style={{ width: '40vw' }} onHide={() => setOrderDetailVisible(false)}>
                {selectedOrderId && orders.find(o => o.id === selectedOrderId) && (
                    (() => {
                        const rowData = orders.find(o => o.id === selectedOrderId);
                        

    return (
                            <div className="flex flex-column gap-4">
                                <div className="surface-100 p-4 border-round flex flex-column gap-2 text-gray-800">
                                    <h3 className="m-0 mb-2">기본 정보</h3>
                                    <div className="flex justify-content-between"><span className="text-600">주문 번호</span> <span className="font-bold">{rowData.orderNo}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">고객명</span> <span className="font-bold">{rowData.customerName}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">디자인</span> <span className="font-bold">{rowData.design}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">표면 마감</span> <span className="font-bold">{rowData.surfaceFinish || '-'}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">각인 내용</span> <span className="font-bold">{rowData.engravingText || '-'} ({rowData.engravingLocation})</span></div>
                                    <div className="flex justify-content-between mt-3 border-top-1 border-300 pt-3"><span className="text-600">현재 상태</span> <span>{statusBodyTemplate(rowData)}</span></div>
                                </div>
                                
                                <div>
                                    <h3 className="m-0 mb-3 text-800">작업 메뉴</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Button label="공정 진행" icon="pi pi-forward" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-success" />
                                        <Button label="외주 처리" icon="pi pi-truck" onClick={() => { setOrderDetailVisible(false); openSubcontractModal(rowData.id); }} className="p-button-secondary" />
                                        <Button label="라벨 인쇄" icon="pi pi-print" onClick={() => handlePrint(rowData, 'label')} className="p-button-outlined p-button-success" />
                                        <Button label="명세서 인쇄" icon="pi pi-file-pdf" onClick={() => handlePrint(rowData, 'invoice')} className="p-button-outlined p-button-info" />
                                        <Button label="변경 요청" icon="pi pi-pencil" onClick={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }} className="p-button-outlined p-button-warning" />
                                        <Button label="주문 취소" icon="pi pi-trash" onClick={() => { setOrderDetailVisible(false); openCancelModal(rowData.id); }} className="p-button-outlined p-button-danger" />
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                )}
            </Dialog>

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
