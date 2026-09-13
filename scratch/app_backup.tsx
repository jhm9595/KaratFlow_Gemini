import { useNavigate } from 'react-router-dom';
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

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';


function App() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const toast = useRef<any>(null);
    const [changeModalVisible, setChangeModalVisible] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);

    
    const [orderDetailVisible, setOrderDetailVisible] = useState(false);
    const [liveEvents, setLiveEvents] = useState<{id: number, message: string, time: string}[]>([]);

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
        surfaceFinish: '?좉킅',
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
                toast.current?.show({ severity: 'success', summary: '諛쒓툒 ?꾨즺', detail: '?뚰듃?덉궗 ?곕룞 PIN??諛쒓툒?섏뿀?듬땲??', life: 5000 });
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
            setCreateOrderForm({ orderType: 'B2C', customerName: '', customerPhone: '', designId: 1, engravingText: '', engravingLocation: '', surfaceFinish: '?좉킅', finalConsumerPrice: 0 });
            toast.current?.show({ severity: 'success', summary: '二쇰Ц ?앹꽦 ?꾨즺', detail: '?덈줈??二쇰Ц???쒖뒪?쒖뿉 ?깅줉?섏뿀?듬땲??', life: 3000 });
        });
    };

    const verifyHandshake = () => {
        fetch('http://localhost:8888/api/handshake/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ pinCode: handshakePin })
        })
        .then(async (res) => {
            if (!res.ok) throw new Error();
            const data = await res.json();
            setHandshakes(handshakes.map(h => h.id === data.id ? data : h));
            toast.current?.show({ severity: 'success', summary: '?몄쬆 ?꾨즺', detail: '?뚰듃?덉궗 ?곕룞???뱀씤?섏뿀?듬땲??', life: 5000 });
            setHandshakePin('');
        })
        .catch(() => {
            toast.current?.show({ severity: 'error', summary: '?몄쬆 ?ㅽ뙣', detail: '?좏슚?섏? ?딄굅??留뚮즺??PIN?낅땲??', life: 3000 });
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
                toast.current?.show({ severity: 'success', summary: '議고쉶 ?깃났', detail: '?뺤긽 ?곸뾽 以묒씤 ?ъ뾽?먯엯?덈떎.', life: 3000 });
            } else {
                toast.current?.show({ severity: 'warn', summary: '二쇱쓽', detail: '怨꾩냽?ъ뾽?먭? ?꾨떃?덈떎 (' + data.statusName + ')', life: 5000 });
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
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(scForm)
        })
        .then(res => res.json())
        .then(newTask => {
            setSubcontracts([...subcontracts, newTask]);
            setScForm({ taskName: '', subcontractorName: '', dispatchedWeightG: 0, agreedLaborFee: 0 });
            toast.current?.show({ severity: 'success', summary: '?몄＜ ?깅줉', detail: '?몄＜ 諛섏텧??湲곕줉?섏뿀?듬땲??', life: 3000 });
        });
    };

    const handleReceiveSubcontract = (taskId: number) => {
        const receivedWeightG = receiveForm[taskId];
        fetch(`http://localhost:8888/api/orders/${selectedOrderId}/subcontracts/${taskId}/receive`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ receivedWeightG })
        })
        .then(res => res.json())
        .then(updatedTask => {
            setSubcontracts(subcontracts.map(s => s.id === taskId ? updatedTask : s));
            toast.current?.show({ severity: 'info', summary: '諛섏엯 ?꾨즺', detail: `媛먮え?? ${updatedTask.lossWeightG}g`, life: 5000 });
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
                toast.current?.show({ severity: 'success', summary: '二쇰Ц 痍⑥냼 ?꾨즺', detail: `?섏닔猷? ??{data.cancellationFee}`, life: 5000 });
                setCancelModalVisible(false);
                fetchOrders();
            });
    };

    const advanceStage = (orderId: number) => {
        fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST', headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'error') {
                    toast.current?.show({ severity: 'error', summary: '?ㅻ쪟', detail: data.message, life: 3000 });
                } else {
                    toast.current?.show({ severity: 'info', summary: '怨듭젙 ?대룞', detail: `二쇰Ц #${orderId} 怨듭젙??[${data.newStage}] ?④퀎濡??대룞?덉뒿?덈떎.`, life: 3000 });
                    fetchOrders();
                }
            })
            .catch(err => {
                toast.current?.show({ severity: 'error', summary: '?ㅻ쪟', detail: '怨듭젙 ?④퀎 ?대룞 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.', life: 3000 });
            });
    };
    const fetchOrders = () => {
        fetch('http://localhost:8888/api/orders', { headers: getAuthHeaders() })
            .then(res => {
                if (res.status === 401 || res.redirected || (res.url && res.url.includes('/login'))) {
                    localStorage.removeItem('jwtToken');
                    navigate('/login');
                    throw new Error('Unauthorized');
                }
                return res.text();
            })
            .then(text => {
                if (text.trim().startsWith('<')) {
                    localStorage.removeItem('jwtToken');
                    navigate('/login');
                    throw new Error('Unauthorized html');
                }
                return JSON.parse(text);
            })
            .then(data => {
                const mappedData = data.map((o: any) => {
                    let s = o.stage;
                    if (s) s = s.toUpperCase();
                    if (s === 'PENDING') s = '?묒닔';
                    else if (s === 'CAD') s = 'CAD';
                    else if (s === 'CASTING' || s === '二쇰Ъ') s = '二쇰Ъ';
                    else if (s === 'POLISHING' || s === '?멸났') s = '?멸났';
                    else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '?꾩꽦';
                    else s = '?묒닔';
                    return { ...o, stage: s };
                });
                setOrders(mappedData);
            })
            .catch(err => console.error('Error fetching orders:', err));
            
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
                            severity: 'info', 
                            summary: 'Live Event', 
                            detail: payload.message, 
                            life: 5000 
                        });
                        setLiveEvents(prev => [{
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

    
    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 二쇰Ъ: 4.5, ?멸났: 8.2 },
        { date: '08/18', CAD: 2.4, 二쇰Ъ: 4.2, ?멸났: 9.1 },
        { date: '08/19', CAD: 1.8, 二쇰Ъ: 5.0, ?멸났: 12.5 }, // 蹂묐ぉ 諛쒖깮
        { date: '08/20', CAD: 2.5, 二쇰Ъ: 4.1, ?멸났: 10.8 },
        { date: '08/21', CAD: 2.0, 二쇰Ъ: 4.8, ?멸났: 8.5 },
        { date: '08/22', CAD: 2.2, 二쇰Ъ: 4.4, ?멸났: 8.0 },
        { date: '08/23', CAD: 1.9, 二쇰Ъ: 4.0, ?멸났: 7.5 },
    ];

    const dailySubcontractData = [
        { date: '08/17', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 28 },
        { date: '08/18', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 30 },
        { date: '08/19', ?쒖씪?꾧툑: 25, ?깆떎怨듬갑: 35 },
        { date: '08/20', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 25 },
        { date: '08/21', ?쒖씪?꾧툑: 21, ?깆떎怨듬갑: 26 },
        { date: '08/22', ?쒖씪?꾧툑: 20, ?깆떎怨듬갑: 28 },
        { date: '08/23', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 24 },
    ];

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

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
    const statusBodyTemplate = (rowData: any) => {
        const stageMap: Record<string, { label: string, severity: 'success' | 'info' | 'warning' | 'danger' | null }> = {
            '?묒닔': { label: '?묒닔', severity: null },
            'CAD': { label: 'CAD', severity: 'info' },
            '二쇰Ъ': { label: '二쇰Ъ', severity: 'warning' },
            '?멸났': { label: '?멸났', severity: 'danger' },
            '?꾩꽦': { label: '?꾩꽦', severity: 'success' }
        };
        
        let s = rowData.stage;
        if (s) s = s.toUpperCase();
        
        if (!stageMap[s]) {
            if (s === 'PENDING') s = '?묒닔';
            else if (s === 'CAD') s = 'CAD';
            else if (s === 'CASTING' || s === '二쇰Ъ') s = '二쇰Ъ';
            else if (s === 'POLISHING' || s === '?멸났') s = '?멸났';
            else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '?꾩꽦';
            else s = '?묒닔';
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

    const surfaceFinishBodyTemplate = (rowData: any) => {
        if (!rowData.surfaceFinish) return <span className="text-500">-</span>;
        return <span className="p-badge p-badge-info">{rowData.surfaceFinish}</span>;
    };

    const engravingBodyTemplate = (rowData: any) => {
        if (!rowData.engravingText) return <span className="text-500">-</span>;
    
    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 二쇰Ъ: 4.5, ?멸났: 8.2 },
        { date: '08/18', CAD: 2.4, 二쇰Ъ: 4.2, ?멸났: 9.1 },
        { date: '08/19', CAD: 1.8, 二쇰Ъ: 5.0, ?멸났: 12.5 }, // 蹂묐ぉ 諛쒖깮
        { date: '08/20', CAD: 2.5, 二쇰Ъ: 4.1, ?멸났: 10.8 },
        { date: '08/21', CAD: 2.0, 二쇰Ъ: 4.8, ?멸났: 8.5 },
        { date: '08/22', CAD: 2.2, 二쇰Ъ: 4.4, ?멸났: 8.0 },
        { date: '08/23', CAD: 1.9, 二쇰Ъ: 4.0, ?멸났: 7.5 },
    ];

    const dailySubcontractData = [
        { date: '08/17', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 28 },
        { date: '08/18', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 30 },
        { date: '08/19', ?쒖씪?꾧툑: 25, ?깆떎怨듬갑: 35 },
        { date: '08/20', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 25 },
        { date: '08/21', ?쒖씪?꾧툑: 21, ?깆떎怨듬갑: 26 },
        { date: '08/22', ?쒖씪?꾧툑: 20, ?깆떎怨듬갑: 28 },
        { date: '08/23', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 24 },
    ];

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

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

    const actionBodyTemplate = (rowData: any) => {
        if (rowData.status === 'CANCELLED') return <span className="text-400">?≪뀡 ?놁쓬</span>;
        
    
    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 二쇰Ъ: 4.5, ?멸났: 8.2 },
        { date: '08/18', CAD: 2.4, 二쇰Ъ: 4.2, ?멸났: 9.1 },
        { date: '08/19', CAD: 1.8, 二쇰Ъ: 5.0, ?멸났: 12.5 }, // 蹂묐ぉ 諛쒖깮
        { date: '08/20', CAD: 2.5, 二쇰Ъ: 4.1, ?멸났: 10.8 },
        { date: '08/21', CAD: 2.0, 二쇰Ъ: 4.8, ?멸났: 8.5 },
        { date: '08/22', CAD: 2.2, 二쇰Ъ: 4.4, ?멸났: 8.0 },
        { date: '08/23', CAD: 1.9, 二쇰Ъ: 4.0, ?멸났: 7.5 },
    ];

    const dailySubcontractData = [
        { date: '08/17', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 28 },
        { date: '08/18', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 30 },
        { date: '08/19', ?쒖씪?꾧툑: 25, ?깆떎怨듬갑: 35 },
        { date: '08/20', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 25 },
        { date: '08/21', ?쒖씪?꾧툑: 21, ?깆떎怨듬갑: 26 },
        { date: '08/22', ?쒖씪?꾧툑: 20, ?깆떎怨듬갑: 28 },
        { date: '08/23', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 24 },
    ];

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return (
            <div className="flex gap-2">
                <Button icon="pi pi-forward" tooltip="怨듭젙 ?대룞" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-rounded p-button-success p-button-text" />
                <Button icon="pi pi-truck" tooltip="?몄＜ 媛먮え 異붿쟻" onClick={() => openSubcontractModal(rowData.id)} className="p-button-rounded p-button-secondary p-button-text" />
                <Button icon="pi pi-print" tooltip="?쇰꺼 ?몄뇙" onClick={() => handlePrint(rowData, 'label')} className="p-button-rounded p-button-success p-button-text" />
                <Button icon="pi pi-file-pdf" tooltip="紐낆꽭???몄뇙" onClick={() => handlePrint(rowData, 'invoice')} className="p-button-rounded p-button-info p-button-text" />
                <Button icon="pi pi-pencil" tooltip="蹂寃??붿껌" onClick={() => { setSelectedOrderId(rowData.id); setChangeModalVisible(true); }} className="p-button-rounded p-button-warning p-button-text" />
                <Button icon="pi pi-trash" tooltip="二쇰Ц 痍⑥냼" onClick={() => openCancelModal(rowData.id)} className="p-button-rounded p-button-danger p-button-text" />
            </div>
        );
    };

    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const pieData = [
        { name: 'B2B', value: orders.filter(o => o.orderType === 'B2B').length },
        { name: 'B2C', value: orders.filter(o => o.orderType === 'B2C').length }
    ];
    
    const stages = ['?묒닔', 'CAD', '二쇰Ъ', '?멸났', '?꾩꽦'];
    const stageCounts = stages.map(stage => ({
        name: stage,
        count: orders.filter(o => o.stage === stage).length
    }));


    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 二쇰Ъ: 4.5, ?멸났: 8.2 },
        { date: '08/18', CAD: 2.4, 二쇰Ъ: 4.2, ?멸났: 9.1 },
        { date: '08/19', CAD: 1.8, 二쇰Ъ: 5.0, ?멸났: 12.5 }, // 蹂묐ぉ 諛쒖깮
        { date: '08/20', CAD: 2.5, 二쇰Ъ: 4.1, ?멸났: 10.8 },
        { date: '08/21', CAD: 2.0, 二쇰Ъ: 4.8, ?멸났: 8.5 },
        { date: '08/22', CAD: 2.2, 二쇰Ъ: 4.4, ?멸났: 8.0 },
        { date: '08/23', CAD: 1.9, 二쇰Ъ: 4.0, ?멸났: 7.5 },
    ];

    const dailySubcontractData = [
        { date: '08/17', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 28 },
        { date: '08/18', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 30 },
        { date: '08/19', ?쒖씪?꾧툑: 25, ?깆떎怨듬갑: 35 },
        { date: '08/20', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 25 },
        { date: '08/21', ?쒖씪?꾧툑: 21, ?깆떎怨듬갑: 26 },
        { date: '08/22', ?쒖씪?꾧툑: 20, ?깆떎怨듬갑: 28 },
        { date: '08/23', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 24 },
    ];

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return (
        <>
            <div className="w-screen h-screen surface-100 text-gray-900 flex flex-column overflow-hidden no-print" style={{ fontFamily: 'Pretendard, sans-serif' }}>
            <Toast ref={toast} />
            
            {/* APM Header */}
            <div className="flex justify-content-between align-items-center px-4 py-3 surface-0 border-bottom-1 border-300 shadow-2">
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-chart-line text-primary" style={{ fontSize: '1.5rem' }}></i>
                    <h2 className="m-0 text-900 font-bold tracking-wide">KaratFlow <span className="text-primary font-normal text-lg ml-2">APM Dashboard</span></h2>
                </div>
                <div className="flex gap-2">
                    <Button label="?쒗뭹蹂??듦퀎" icon="pi pi-chart-bar" className="p-button-outlined p-button-secondary p-button-sm" onClick={() => navigate('/stats')} />
                    <Button label="??二쇰Ц" icon="pi pi-plus" className="p-button-primary p-button-sm" onClick={() => setCreateOrderModalVisible(true)} />
                    <Button label="?뚰듃?? icon="pi pi-users" className="p-button-outlined p-button-info p-button-sm" onClick={openHandshakeModal} />
                    <Button label={t('lang')} icon="pi pi-globe" className="p-button-text p-button-secondary p-button-sm text-700" onClick={toggleLanguage} />
                    <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                        <div className="w-2rem h-2rem border-circle bg-primary flex align-items-center justify-content-center text-white font-bold text-sm">
                            <i className="pi pi-user"></i>
                        </div>
                        <span className="text-700 font-bold text-sm">濡쒓렇?몃맖</span>
                        <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger ml-2" aria-label="Logout" tooltip="濡쒓렇?꾩썐" tooltipOptions={{position: 'bottom'}} onClick={handleLogout} />
                    </div>
                </div>
            </div>

            {/* APM Main Content */}
            <div className="flex-1 flex overflow-hidden p-3 gap-3">
                
                {/* Left Panel: Metrics & Charts */}
                <div className="flex flex-column gap-3" style={{ width: '450px' }}>
                    <div className="surface-0 p-3 border-round shadow-1">
                        <h4 className="m-0 mb-3 text-600 font-medium">?ㅼ떆媛??듯빀 吏??/h4>
                        <div className="flex justify-content-between align-items-end mb-3">
                            <span className="text-600">吏꾪뻾以?二쇰Ц</span>
                            <span className="text-3xl font-bold text-900">{orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'COMPLETED').length} <small className="text-sm font-normal text-gray-500">嫄?/small></span>
                        </div>
                        <div className="flex justify-content-between align-items-end mb-3">
                            <span className="text-600">?뱀씪 ?꾨즺</span>
                            <span className="text-3xl font-bold text-green-400">{orders.filter(o => o.status === 'COMPLETED').length} <small className="text-sm font-normal text-gray-500">嫄?/small></span>
                        </div>
                    </div>
                    
                    
                    {/* Advanced Chart 1: 蹂묐ぉ 遺꾩꽍 */}
                    <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                        <h4 className="m-0 mb-3 text-600 font-medium">?쇱옄蹂?怨듭젙 由щ뱶???(?쒓컙)</h4>
                        <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyProcessData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="CAD" stackId="a" fill="#8884d8" name="CAD" />
                                    <Bar dataKey="二쇰Ъ" stackId="a" fill="#82ca9d" name="二쇰Ъ" />
                                    <Bar dataKey="?멸났" stackId="a" fill="#ffc658" name="?멸났" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Advanced Chart 2: ?몄＜ 由щ뱶???*/}
                    <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                        <h4 className="m-0 mb-3 text-600 font-medium">?몄＜ ?낆껜蹂??뚯슂?쒓컙 異붿씠 (?쒓컙)</h4>
                        <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailySubcontractData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="?쒖씪?꾧툑" stroke="#8884d8" strokeWidth={3} dot={{r: 4}} />
                                    <Line type="monotone" dataKey="?깆떎怨듬갑" stroke="#82ca9d" strokeWidth={3} dot={{r: 4}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-column gap-3 overflow-hidden">
                    <div className="surface-0 p-4 border-round shadow-1">
                        <h4 className="m-0 mb-4 text-600 font-medium">?ㅼ떆媛?怨듭젙 ?꾪솴 (Pipeline)</h4>
                        <div className="flex justify-content-between align-items-center px-4 relative">
                            <div className="absolute w-full z-0" style={{ height: '4px', backgroundColor: '#e5e7eb', top: '30px', left: '0' }}></div>
                            
                            {stageCounts.map((s, i) => {
                                const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                    '?묒닔': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                    'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                    '二쇰Ъ': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                    '?멸났': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                    '?꾩꽦': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                };
                                const color = stageColors[s.name] || stageColors['?묒닔'];
                                
                                return (
                                    <div key={s.name} className="flex flex-column align-items-center z-1 relative bg-white" style={{ borderRadius: '50%' }}>
                                        <div className={`flex align-items-center justify-content-center border-circle border-2 ${color.bg} ${color.border} mb-2 shadow-1`} style={{ width: '60px', height: '60px' }}>
                                            <span className={`text-2xl font-bold ${color.text}`}>{s.count}</span>
                                        </div>
                                        <span className="text-700 font-medium bg-white px-2">{s.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column overflow-hidden">
                        <h4 className="m-0 mb-3 text-600 font-medium">?곸꽭 二쇰Ц 紐⑤땲?곕쭅</h4>
                        <div className="flex-1 overflow-auto custom-dark-table pb-3">
                            {/* @ts-ignore */}
                            <DataTable value={orders} size="small" paginator rows={10} selectionMode="single" selection={selectedOrderId === null ? null : orders.find(o => o.id === selectedOrderId)} onSelectionChange={(e) => { setSelectedOrderId(e.value?.id); if(e.value) setOrderDetailVisible(true); }} dataKey="id" emptyMessage="?쒖꽦 二쇰Ц???놁뒿?덈떎." className="p-datatable-sm cursor-pointer" rowClassName={() => 'surface-0 text-900 hover:surface-50 transition-colors transition-duration-200'}>
                                <Column header="二쇰Ц 踰덊샇" body={(r) => <span className="font-bold text-primary">#{r.orderNo || r.id}</span>} style={{ minWidth: '120px' }} />
                                <Column field="design" header="Design" />
                                <Column field="customerName" header="怨좉컼紐? />
                                <Column field="stage" header="怨듭젙 ?곹깭" body={statusBodyTemplate}></Column>
                                <Column header="" body={(rowData) => <Button icon="pi pi-eye" onClick={() => { setSelectedOrderId(rowData.id); setOrderDetailVisible(true); }} className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="?곸꽭蹂닿린" tooltip="?곸꽭蹂닿린" tooltipOptions={{position: 'left'}} />} style={{ width: '60px' }} />
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
                        {liveEvents.length === 0 ? (
                            <div className="text-center text-gray-500 py-4 mt-5">理쒓렐 諛쒖깮???대깽?멸? ?놁뒿?덈떎.</div>
                        ) : (
                            liveEvents.map(ev => (
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

            {/* Hidden Modals and Print Views... (Preserving exactly from original) */}

            
            {/* @ts-ignore */}
            <Dialog header="二쇰Ц ?곸꽭 ?뺣낫" visible={orderDetailVisible} style={{ width: '40vw' }} onHide={() => setOrderDetailVisible(false)}>
                {selectedOrderId && orders.find(o => o.id === selectedOrderId) && (
                    (() => {
                        const rowData = orders.find(o => o.id === selectedOrderId);
                    
    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 二쇰Ъ: 4.5, ?멸났: 8.2 },
        { date: '08/18', CAD: 2.4, 二쇰Ъ: 4.2, ?멸났: 9.1 },
        { date: '08/19', CAD: 1.8, 二쇰Ъ: 5.0, ?멸났: 12.5 }, // 蹂묐ぉ 諛쒖깮
        { date: '08/20', CAD: 2.5, 二쇰Ъ: 4.1, ?멸났: 10.8 },
        { date: '08/21', CAD: 2.0, 二쇰Ъ: 4.8, ?멸났: 8.5 },
        { date: '08/22', CAD: 2.2, 二쇰Ъ: 4.4, ?멸났: 8.0 },
        { date: '08/23', CAD: 1.9, 二쇰Ъ: 4.0, ?멸났: 7.5 },
    ];

    const dailySubcontractData = [
        { date: '08/17', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 28 },
        { date: '08/18', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 30 },
        { date: '08/19', ?쒖씪?꾧툑: 25, ?깆떎怨듬갑: 35 },
        { date: '08/20', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 25 },
        { date: '08/21', ?쒖씪?꾧툑: 21, ?깆떎怨듬갑: 26 },
        { date: '08/22', ?쒖씪?꾧툑: 20, ?깆떎怨듬갑: 28 },
        { date: '08/23', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 24 },
    ];

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return (
                            <div className="flex flex-column gap-4">
                                <div className="surface-100 p-4 border-round flex flex-column gap-2 text-gray-800">
                                    <h3 className="m-0 mb-2">湲곕낯 ?뺣낫</h3>
                                    <div className="flex justify-content-between"><span className="text-600">二쇰Ц 踰덊샇</span> <span className="font-bold">{rowData.orderNo}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">怨좉컼紐?/span> <span className="font-bold">{rowData.customerName}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">?붿옄??/span> <span className="font-bold">{rowData.design}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">?쒕㈃ 留덇컧</span> <span className="font-bold">{rowData.surfaceFinish || '-'}</span></div>
                                    <div className="flex justify-content-between"><span className="text-600">媛곸씤 ?댁슜</span> <span className="font-bold">{rowData.engravingText || '-'} ({rowData.engravingLocation})</span></div>
                                    <div className="flex justify-content-between mt-3 border-top-1 border-300 pt-3"><span className="text-600">?꾩옱 ?곹깭</span> <span>{statusBodyTemplate(rowData)}</span></div>
                                </div>
                                
                                <div>
                                    <h3 className="m-0 mb-3 text-900">?묒뾽 硫붾돱 (Actions)</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Button label="怨듭젙 ?대룞" icon="pi pi-forward" onClick={() => advanceStage(rowData.id)} disabled={rowData.status === 'COMPLETED'} className="p-button-success" />
                                        <Button label="?몄＜ 異붿쟻" icon="pi pi-truck" onClick={() => { setOrderDetailVisible(false); openSubcontractModal(rowData.id); }} className="p-button-secondary" />
                                        <Button label="?쇰꺼 ?몄뇙" icon="pi pi-print" onClick={() => handlePrint(rowData, 'label')} className="p-button-outlined p-button-success" />
                                        <Button label="紐낆꽭???몄뇙" icon="pi pi-file-pdf" onClick={() => handlePrint(rowData, 'invoice')} className="p-button-outlined p-button-info" />
                                        <Button label="蹂寃?蹂대쪟" icon="pi pi-pencil" onClick={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }} className="p-button-outlined p-button-warning" />
                                        <Button label="二쇰Ц 痍⑥냼" icon="pi pi-trash" onClick={() => { setOrderDetailVisible(false); openCancelModal(rowData.id); }} className="p-button-outlined p-button-danger" />
                                    </div>
                                </div>
                            </div>
                        )
                    })()
                )}
            </Dialog>

            {/* Original Modals */}
            <Dialog header="??二쇰Ц ?앹꽦" visible={createOrderModalVisible} style={{ width: '50vw' }} onHide={() => setCreateOrderModalVisible(false)}>
                    <div className="flex flex-column gap-3 p-fluid">
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">援щ텇</span>
                            <InputText value={createOrderForm.orderType} onChange={(e) => setCreateOrderForm({...createOrderForm, orderType: e.target.value})} placeholder="B2C, B2B ?? />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">怨좉컼紐?/span>
                            <InputText value={createOrderForm.customerName} onChange={(e) => setCreateOrderForm({...createOrderForm, customerName: e.target.value})} placeholder="怨좉컼 ?대쫫" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">?곕씫泥?/span>
                            <InputText value={createOrderForm.customerPhone} onChange={(e) => setCreateOrderForm({...createOrderForm, customerPhone: e.target.value})} placeholder="010-0000-0000" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">媛곸씤 臾멸뎄</span>
                            <InputText value={createOrderForm.engravingText} onChange={(e) => setCreateOrderForm({...createOrderForm, engravingText: e.target.value})} placeholder="媛곸씤???띿뒪??(?듭뀡)" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">媛곸씤 ?꾩튂</span>
                            <InputText value={createOrderForm.engravingLocation} onChange={(e) => setCreateOrderForm({...createOrderForm, engravingLocation: e.target.value})} placeholder="諛섏? ?덉そ ??(?듭뀡)" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">?쒕㈃ 泥섎━</span>
                            <InputText value={createOrderForm.surfaceFinish} onChange={(e) => setCreateOrderForm({...createOrderForm, surfaceFinish: e.target.value})} placeholder="?좉킅/臾닿킅" />
                        </div>
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">?뚮퉬?먭?(??</span>
                            <InputNumber value={createOrderForm.finalConsumerPrice} onValueChange={(e) => setCreateOrderForm({...createOrderForm, finalConsumerPrice: e.value || 0})} mode="currency" currency="KRW" locale="ko-KR" />
                        </div>
                    </div>
                    <div className="flex justify-content-end mt-4">
                        <Button label="痍⑥냼" icon="pi pi-times" onClick={() => setCreateOrderModalVisible(false)} className="p-button-text p-button-secondary mr-2" />
                        <Button label="二쇰Ц ?깅줉" icon="pi pi-check" onClick={submitCreateOrder} className="p-button-primary" autoFocus />
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
                <Dialog header="二쇰Ц 痍⑥냼 諛??꾩빟湲??뺤씤" visible={cancelModalVisible} style={{ width: '40vw' }} onHide={() => setCancelModalVisible(false)}>
                    <div className="flex flex-column align-items-center justify-content-center text-center p-4">
                        <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '3rem' }}></i>
                        <h2 className="mt-3">二쇰Ц???뺣쭚 痍⑥냼?섏떆寃좎뒿?덇퉴?</h2>
                        <p className="m-0 mb-4 text-600">
                            ?꾩옱 怨듭젙 吏꾪뻾 ?곹깭???곕씪 ?꾩빟湲덉씠 遺怨쇰맗?덈떎.<br/>
                            ??踰?痍⑥냼??二쇰Ц? 蹂듦뎄?????놁뒿?덈떎.
                        </p>
                        
                        <div className="surface-100 p-4 border-round w-full">
                            <h3 className="m-0 mb-2">?덉긽 ?꾩빟湲?(痍⑥냼 ?섏닔猷?</h3>
                            <h2 className="m-0 text-red-500">??cancelEstimate?.toLocaleString()}</h2>
                        </div>
                    </div>
                    <div className="flex justify-content-end mt-4">
                        <Button label="?뚯븘媛湲? icon="pi pi-times" onClick={() => setCancelModalVisible(false)} className="p-button-text p-button-secondary" />
                        <Button label="二쇰Ц 痍⑥냼 ?뺤젙" icon="pi pi-trash" onClick={submitCancelOrder} className="p-button-danger" autoFocus />
                    </div>
                </Dialog>

                {/* @ts-ignore */}
                <Dialog header={t('handshake')} visible={partnerModalVisible} style={{ width: '50vw' }} onHide={() => setPartnerModalVisible(false)}>
                    <p className="m-0 mb-3">{t('handshake_desc')}</p>
                    
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-4 border-round h-full flex flex-column align-items-center justify-content-center">
                                <h3 className="m-0 mb-2">?뚰듃?덉궗 ?곕룞 ?붿껌 (?踰덊샇 諛쒓툒)</h3>
                                <p className="text-sm text-600 mb-4 text-center">?쒖“?낆껜?먭쾶 ?꾨떖??1?뚯슜 6?먮━ ?踰덊샇瑜?諛쒓툒諛쏆뒿?덈떎.</p>
                                {generatedPin ? (
                                    <div className="text-center">
                                        <h1 className="text-primary m-0" style={{ fontSize: '3rem', letterSpacing: '0.5rem' }}>{generatedPin}</h1>
                                        <small className="text-500">???踰덊샇瑜??쒖“?낆껜?먭쾶 ?뚮젮二쇱꽭??</small>
                                    </div>
                                ) : (
                                    <Button label="?踰덊샇 諛쒓툒諛쏄린" icon="pi pi-key" onClick={requestHandshake} />
                                )}
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="surface-100 p-4 border-round h-full flex flex-column align-items-center justify-content-center">
                                <h3 className="m-0 mb-2">?뚰듃?덉궗 ?몄쬆 (?踰덊샇 ?낅젰)</h3>
                                <p className="text-sm text-600 mb-4 text-center">?뚮ℓ?낆껜濡쒕????꾨떖諛쏆? 6?먮━ ?踰덊샇瑜??낅젰?섏뿬 ?곕룞???뱀씤?⑸땲??</p>
                                <div className="p-inputgroup">
                                    <InputText placeholder="6?먮━ PIN ?낅젰" value={handshakePin} onChange={(e) => setHandshakePin(e.target.value)} maxLength={6} className="text-center text-xl font-bold" />
                                    <Button label="?몄쬆" icon="pi pi-check" severity="success" onClick={verifyHandshake} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="mt-5 mb-3">?ъ뾽??吏꾩쐞 寃利?/h3>
                    <div className="surface-100 p-4 border-round mb-4">
                        <p className="text-sm text-600 mb-3">?뚰듃?덉궗???ъ뾽?먮벑濡앸쾲??10?먮━)瑜??낅젰?섏뿬 援?꽭泥????먯뾽 ?곹깭瑜?議고쉶?⑸땲??</p>
                        <div className="p-inputgroup mb-3" style={{ maxWidth: '400px' }}>
                            <InputText placeholder="?ъ뾽?먮쾲??(?レ옄留?" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} />
                            <Button label="寃利앺븯湲? icon="pi pi-search" onClick={verifyBusiness} />
                        </div>
                        {businessResult && (
                            <div className={`p-3 border-round ${businessResult.statusCode === '01' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <i className={`pi ${businessResult.statusCode === '01' ? 'pi-check-circle' : 'pi-times-circle'} mr-2`}></i>
                                <strong>[{businessResult.businessNumber}]</strong> {businessResult.statusName} ({businessResult.taxType})
                            </div>
                        )}
                    </div>

                    <h3 className="mt-5 mb-3">???뚰듃?덉떗 紐⑸줉</h3>
                    <div className="surface-border border-top-1 pt-3">
                        {handshakes.length === 0 ? (
                            <p className="text-500 text-center py-4">?곕룞???뚰듃?덉궗媛 ?놁뒿?덈떎.</p>
                        ) : (
                            <div className="flex flex-column gap-2">
                                {handshakes.map(h => (
                                    <div key={h.id} className="flex justify-content-between align-items-center surface-50 p-3 border-round">
                                        <div>
                                            <div className="font-bold">{h.targetCompanyName} <i className="pi pi-arrows-h mx-2 text-400"></i> {h.requesterCompanyName}</div>
                                            <small className="text-500">?붿껌?? {new Date(h.createdAt).toLocaleString()}</small>
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
                <Dialog header="?몄＜ 怨듭젙 愿由?諛?湲?媛먮え 異붿쟻" visible={subcontractModalVisible} style={{ width: '60vw' }} onHide={() => setSubcontractModalVisible(false)}>
                    <div className="flex flex-column gap-4">
                        <div className="surface-100 p-3 border-round">
                            <h3>?좉퇋 ?몄＜ 諛섏텧 湲곕줉</h3>
                            <div className="grid">
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>?묒뾽紐?(?? ?꾧툑)</label>
                                    <InputText className="w-full" value={scForm.taskName} onChange={(e) => setScForm({...scForm, taskName: e.target.value})} />
                                </div>
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>?몄＜?낆껜紐?/label>
                                    <InputText className="w-full" value={scForm.subcontractorName} onChange={(e) => setScForm({...scForm, subcontractorName: e.target.value})} />
                                </div>
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>諛섏텧 ?ㅼ륫 以묐웾 (g)</label>
                                    <InputNumber className="w-full" value={scForm.dispatchedWeightG} onValueChange={(e) => setScForm({...scForm, dispatchedWeightG: e.value || 0})} mode="decimal" minFractionDigits={2} />
                                </div>
                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>?⑹쓽 ?몄＜怨듭엫 (??</label>
                                    <InputNumber className="w-full" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
                                </div>
                            </div>
                            <Button label="諛섏텧 ?깅줉 (Dispatch)" icon="pi pi-upload" onClick={handleDispatchSubcontract} className="mt-3 p-button-success" />
                        </div>

                        <div>
                            <h3>?몄＜ ?댁뿭</h3>
                            {/* @ts-ignore */}
                            <DataTable value={subcontracts} responsiveLayout="scroll">
                                <Column field="taskName" header="?묒뾽紐?></Column>
                                <Column field="subcontractorName" header="?몄＜?낆껜"></Column>
                                <Column field="status" header="?곹깭" body={(r) => <span className={`p-badge ${r.status === 'RECEIVED' ? 'p-badge-info' : 'p-badge-warning'}`}>{r.status}</span>}></Column>
                                <Column field="dispatchedWeightG" header="諛섏텧(g)"></Column>
                                <Column header="諛섏엯(g)" body={(r) => {
                                    if (r.status === 'RECEIVED') return <span>{r.receivedWeightG}</span>;
                                
    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 二쇰Ъ: 4.5, ?멸났: 8.2 },
        { date: '08/18', CAD: 2.4, 二쇰Ъ: 4.2, ?멸났: 9.1 },
        { date: '08/19', CAD: 1.8, 二쇰Ъ: 5.0, ?멸났: 12.5 }, // 蹂묐ぉ 諛쒖깮
        { date: '08/20', CAD: 2.5, 二쇰Ъ: 4.1, ?멸났: 10.8 },
        { date: '08/21', CAD: 2.0, 二쇰Ъ: 4.8, ?멸났: 8.5 },
        { date: '08/22', CAD: 2.2, 二쇰Ъ: 4.4, ?멸났: 8.0 },
        { date: '08/23', CAD: 1.9, 二쇰Ъ: 4.0, ?멸났: 7.5 },
    ];

    const dailySubcontractData = [
        { date: '08/17', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 28 },
        { date: '08/18', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 30 },
        { date: '08/19', ?쒖씪?꾧툑: 25, ?깆떎怨듬갑: 35 },
        { date: '08/20', ?쒖씪?꾧툑: 24, ?깆떎怨듬갑: 25 },
        { date: '08/21', ?쒖씪?꾧툑: 21, ?깆떎怨듬갑: 26 },
        { date: '08/22', ?쒖씪?꾧툑: 20, ?깆떎怨듬갑: 28 },
        { date: '08/23', ?쒖씪?꾧툑: 22, ?깆떎怨듬갑: 24 },
    ];

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return (
                                        <div className="flex gap-2 align-items-center">
                                            <InputNumber value={receiveForm[r.id]} onValueChange={(e) => setReceiveForm({...receiveForm, [r.id]: e.value || 0})} className="w-5rem" mode="decimal" minFractionDigits={2} />
                                            <Button icon="pi pi-download" onClick={() => handleReceiveSubcontract(r.id)} className="p-button-sm" tooltip="諛섏엯 ?뺤씤" />
                                        </div>
                                    );
                                }}></Column>
                                <Column header="媛먮え??g)" body={(r) => {
                                    if (r.lossWeightG === null || r.lossWeightG === undefined) return '-';
                                    const percent = ((r.lossWeightG / r.dispatchedWeightG) * 100).toFixed(1);
                                    return <span className={r.lossWeightG > 0 ? "text-red-500 font-bold" : ""}>{r.lossWeightG.toFixed(2)} ({percent}%)</span>;
                                }}></Column>
                                <Column field="agreedLaborFee" header="怨듭엫鍮???" body={(r) => <span>??r.agreedLaborFee?.toLocaleString()}</span>}></Column>
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
                            媛곸씤: {printOrder.engravingText} ({printOrder.engravingLocation})
                        </div>
                    )}
                </div>
            )}

            {printOrder && printMode === 'invoice' && (
                <div className="print-mode-invoice">
                    <h1>{printOrder.orderType === 'B2B' ? '嫄곕옒紐낆꽭??(?꾨ℓ??' : '?덉쭏蹂댁쬆??(怨좉컼??'}</h1>
                    
                    <p><strong>二쇰Ц踰덊샇:</strong> {printOrder.orderNo || `KF-${printOrder.id}`}</p>
                    <p><strong>怨좉컼/?낆껜紐?</strong> {printOrder.customerName || '吏?뺣릺吏 ?딆쓬'}</p>
                    <p><strong>?곕씫泥?</strong> {printOrder.customerPhone || '吏?뺣릺吏 ?딆쓬'}</p>
                    <p><strong>二쇰Ц?쇱옄:</strong> {printOrder.date}</p>

                    <table>
                        <thead>
                            <tr>
                                <th>?쒗뭹肄붾뱶 (?붿옄??</th>
                                <th>?쒕㈃ 留덇컧</th>
                                <th>媛곸씤 ?댁슜</th>
                                {printOrder.orderType === 'B2C' && <th>?뚮퉬?먭?寃?/th>}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{printOrder.design}</td>
                                <td>{printOrder.surfaceFinish || '湲곕낯'}</td>
                                <td>{printOrder.engravingText || '?놁쓬'}</td>
                                {printOrder.orderType === 'B2C' && <td>{printOrder.finalConsumerPrice ? printOrder.finalConsumerPrice.toLocaleString() + '?? : '蹂꾨룄 臾몄쓽'}</td>}
                            </tr>
                        </tbody>
                    </table>

                    {printOrder.invoice && printOrder.orderType === 'B2B' && (
                        <div style={{ marginTop: '20mm', border: '1px solid #000', padding: '10px' }}>
                            <h3>?뺤궛 ?곸꽭 (B2B ?꾩슜)</h3>
                            <p><strong>?곸슜 湲??쒖꽭:</strong> ??printOrder.invoice.goldPricePer375g?.toLocaleString()} (湲곗??? {printOrder.invoice.priceDate})</p>
                            <p><strong>異쒓퀬 ?ㅼ륫 以묐웾:</strong> {printOrder.invoice.completedWeightG}g / <strong>?ㅽ넠 以묐웾:</strong> {printOrder.invoice.stoneWeightG}g</p>
                            <p><strong>?뺤궛 湲곗? 以묐웾 (?대━??{printOrder.invoice.lossRatePercent}%):</strong> {printOrder.invoice.settlementBaseWeightG?.toFixed(3)}g</p>
                            <p><strong>湲?泥?뎄??</strong> ??printOrder.invoice.calculatedGoldPrice?.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                            <p><strong>?먯껌 怨듭엫:</strong> ??printOrder.invoice.baseLaborFee?.toLocaleString()}</p>
                            <p><strong>?ㅽ넠鍮?</strong> ??printOrder.invoice.stoneFee?.toLocaleString()}</p>
                            <h2 style={{ marginTop: '10px', color: '#b91c1c' }}>理쒖쥌 泥?뎄?? ??printOrder.invoice.finalBillingAmount?.toLocaleString(undefined, {maximumFractionDigits:0})}</h2>
                        </div>
                    )}
                    
                    {printOrder.orderType === 'B2B' && (
                        <div style={{ marginTop: '30mm' }}>
                            <p>??湲덉븸???곸닔?? (怨듦툒???쒕챸: _______________ )</p>
                        </div>
                    )}
                    
                    {printOrder.orderType === 'B2C' && (
                        <div style={{ marginTop: '30mm', textAlign: 'center' }}>
                            <p>蹂??쒗뭹? ?꾧꺽???덉쭏愿由щ? 嫄곗퀜 ?쒖옉?섏뿀?뚯쓣 蹂댁쬆?⑸땲??</p>
                            <p><strong>KaratFlow Jewelry</strong></p>
                        </div>
                    )}
                </div>
            )}
        
        </>
    );
}

export default App;

