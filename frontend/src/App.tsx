import { Tag } from 'primereact/tag';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'primereact/image';
import { Badge } from 'primereact/badge';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { ProcessManager } from './ProcessManager';
import { GoldToolsModal } from './GoldToolsModal';
import GoldWidget from './components/widgets/GoldWidget';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { AutoComplete } from 'primereact/autocomplete';
import { Timeline } from 'primereact/timeline';

import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Client } from '@stomp/stompjs';
import i18n from './i18n';
import { PetroleumChart } from './components/charts/PetroleumChart';
import { KospiChart } from './components/charts/KospiChart';
import { OrderDetailModal } from './components/OrderDetailModal';
import { MultiOrderDetailModal } from './components/MultiOrderDetailModal';
import { CreateOrderModal } from './components/CreateOrderModal';
import { ChangeRequestModal } from './components/ChangeRequestModal';
import { CancelOrderModal } from './components/CancelOrderModal';
import { PartnerHandshakeModal } from './components/PartnerHandshakeModal';
import { SubcontractModal } from './components/SubcontractModal';



const formatElapsed = (start: string | null, end: string | null) => {
    if (!start || !end) return '';
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';
    const diff = Math.max(0, d2.getTime() - d1.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    let str = '+';
    if (days > 0) str += `${days}일 `;
    if (hours > 0) str += `${hours}시간 `;
    if (mins > 0 || str === '+') str += `${mins}분`;
    return str;
};

const getTimelineEvents = (rowData: any) => {
    if (!rowData) return [];
    const events = [
        { stage: '주문 생성', date: rowData.createdAt, icon: 'pi pi-file', color: '#9E9E9E' },
        { stage: '접수', date: rowData.pendingCompletedAt, icon: 'pi pi-check', color: '#64748B' },
        { stage: 'CAD', date: rowData.cadCompletedAt, icon: 'pi pi-desktop', color: '#3B82F6' },
        { stage: '주물 (Casting)', date: rowData.castingCompletedAt, icon: 'pi pi-box', color: '#F97316' },
        { stage: '세공 (Polishing)', date: rowData.polishingCompletedAt, icon: 'pi pi-star', color: '#EAB308' },
        { stage: '도금/검수', date: rowData.platingCompletedAt, icon: 'pi pi-eye', color: '#22C55E' }
    ];
    
    let validEvents = events.filter(e => e.date);
    
    // Calculate elapsed
    return validEvents.map((ev, i) => {
        let elapsed = '';
        if (i > 0) {
            elapsed = formatElapsed(validEvents[i-1].date, ev.date);
        }
        return { ...ev, elapsed };
    });
};

const customizedMarker = (item: any) => {

    return (
        <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: item.color }}>
            <i className={item.icon}></i>
        </span>
    );
};

const customizedContent = (item: any) => {
    return (
        <div className="mb-4">
            <div className="font-bold text-700">{item.stage}</div>
            <div className="text-500 text-sm">{new Date(item.date).toLocaleString()}</div>
            {item.elapsed && <div className="text-pink-500 font-bold text-sm mt-1">{item.elapsed}</div>}
        </div>
    );
};

function App() {


    const getEventBorderColor = (msg: string) => {
        if (!msg) return '#3B82F6';
        if (msg.includes('접수') || msg.includes('신규')) return '#64748B';
        if (msg.includes('CAD')) return '#3B82F6';
        if (msg.includes('주물')) return '#F59E0B';
        if (msg.includes('세공')) return '#EF4444';
        if (msg.includes('완성')) return '#22C55E';
        if (msg.includes('보류') || msg.includes('HOLD')) return '#EAB308';
        return '#3B82F6';
    };

    const { t } = useTranslation();
    const toast = useRef<any>(null);
    const [changeModalVisible, setChangeModalVisible] = useState(false);
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [partnerModalVisible, setPartnerModalVisible] = useState(false);
    const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [pipelineStages, setPipelineStages] = useState<string[]>(['접수', 'CAD', '주물', '세공', '완료']);
    const [pipelineSteps, setPipelineSteps] = useState<any[]>([
        { stageName: '접수', colorHex: '#38BDF8', colorGradient: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)' },
        { stageName: 'CAD', colorHex: '#C084FC', colorGradient: 'linear-gradient(135deg, #e879f9 0%, #c084fc 100%)' },
        { stageName: '주물', colorHex: '#FB923C', colorGradient: 'linear-gradient(135deg, #fde047 0%, #fb923c 100%)' },
        { stageName: '세공', colorHex: '#F472B6', colorGradient: 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)' },
        { stageName: '완료', colorHex: '#34D399', colorGradient: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)' }
    ]);

    const fetchPipelineStages = () => {
        fetch('http://localhost:8888/api/process-templates', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then((templates: any[]) => {
                if (Array.isArray(templates) && templates.length > 0) {
                    const defaultTpl = templates.find(t => t.isDefault) || templates[0];
                    if (defaultTpl && defaultTpl.steps && defaultTpl.steps.length > 0) {
                        setPipelineSteps(defaultTpl.steps);
                        const stages = defaultTpl.steps.map((s: any) => s.stageName);
                        setPipelineStages(stages);
                    }
                }
            })
            .catch(err => console.error('Failed to fetch pipeline stages:', err));
    };

    // Load all products once for AutoComplete suggestions
    const loadAllProducts = () => {
        fetch('http://localhost:8888/api/products', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setAllProducts(Array.isArray(data) ? data : []))
            .catch(() => {});
    };

    const searchProduct = (event: any) => {
        const query = (event.query || '').toLowerCase();
        const filtered = allProducts.filter((p: any) =>
            (p.name || '').toLowerCase().includes(query) ||
            (p.brand || '').toLowerCase().includes(query) ||
            (p.designCode || '').toLowerCase().includes(query)
        );
        setFilteredProducts(filtered);
    };

    const handleFileUpload = (e: any) => {
        if (e.files && e.files[0]) {
            setCreateOrderForm({...createOrderForm, imageUrl: '/uploads/mock.png'});
        }
    };

        const [orderDetailVisible, setOrderDetailVisible] = useState(false);
    const [orderDetailData, setOrderDetailData] = useState<any>(null);

    const openOrderDetail = (orderId: number) => {
        setSelectedOrderId(orderId);
        fetch(`http://localhost:8888/api/orders/${orderId}/details`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setOrderDetailData(data);
                setOrderDetailVisible(true);
            })
            .catch(err => {
                console.error('Failed to fetch details', err);
                setOrderDetailVisible(true);
            });
    };
    
    const [_liveEvents, _setLiveEvents] = useState<{id: number, message: string, time: string}[]>([]);
    const [_dashboardStats, setDashboardStats] = useState({
        totalRevenue: 0,
        activeOrders: 0,
        totalOrders: 0,
        cancellationRate: 0
    });
    
    const [createOrderForm, setCreateOrderForm] = useState<any>({
        orderType: 'B2C',
        customerName: '',
        customerPhone: '',
        designId: 1,
        engravingText: '',
        engravingLocation: '',
        surfaceFinish: '유광',
        finalConsumerPrice: 0,
        quantity: 1,
        unmappedBrandName: '',
        unmappedProductName: '',
        imageUrl: ''
    });

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [printOrder, setPrintOrder] = useState<any>(null);
    const [printMode, setPrintMode] = useState<'label' | 'invoice' | null>(null);

    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelEstimate, setCancelEstimate] = useState<number | null>(null);

    const [subcontractModalVisible, setSubcontractModalVisible] = useState(false);
        const [processManagerVisible, setProcessManagerVisible] = useState(false);
    const [goldToolsVisible, setGoldToolsVisible] = useState(false);
    

    const [subcontracts, setSubcontracts] = useState<any[]>([]);
    const [scForm, setScForm] = useState({ taskName: '', subcontractorName: '', dispatchedWeightG: 0, agreedLaborFee: 0 });
    const [receiveForm, setReceiveForm] = useState<{ [key: number]: number }>({});

    const [handshakes, setHandshakes] = useState<any[]>([]);
    const [handshakePin, setHandshakePin] = useState('');
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);
    const [businessNumber, setBusinessNumber] = useState('');
    const [businessResult, setBusinessResult] = useState<any>(null);

    const getAuthHeaders = (): Record<string, string> => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('jwtToken');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
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
        setReceiveForm(prev => {
            const receivedWeightG = prev[taskId] || 0;
            fetch(`http://localhost:8888/api/orders/${selectedOrderId}/subcontracts/${taskId}/receive`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ receivedWeightG })
            })
            .then(res => res.json())
            .then(updatedTask => {
                setSubcontracts(sub => sub.map(s => s.id === taskId ? updatedTask : s));
                toast.current?.show({ severity: 'info', summary: '반입 완료', detail: `감모량 ${updatedTask.lossWeightG}g`, life: 5000 });
            });
            return prev;
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
                if (data.status === 'error' || (data.message && data.message.includes('템플릿'))) {
                    toast.current?.show({ 
                        severity: 'warn', 
                        summary: '공정 템플릿 추가 안내', 
                        detail: '공정 진행을 위해 템플릿 등록이 필요합니다. [공정 관리] 모달을 엽니다.', 
                        life: 4000 
                    });
                    setProcessManagerVisible(true);
                } else {
                    fetchOrders();
                    openOrderDetail(orderId);
                }
            })
            .catch((_err) => {
                toast.current?.show({ 
                    severity: 'warn', 
                    summary: '공정 템플릿 추가 안내', 
                    detail: '유효한 공정 템플릿을 찾을 수 없습니다. [공정 관리]에서 새로운 템플릿을 추가해 주세요.', 
                    life: 4000 
                });
                setProcessManagerVisible(true);
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
                const mappedData = data.map((o: any) => ({
                    ...o,
                    stage: o.stage || '접수'
                }));
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
        fetchPipelineStages();
        
        fetch('http://localhost:8888/api/metal-prices/recent', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setGoldPriceData(data))
            .catch(err => console.error('Failed to fetch metal prices', err));

        const client = new Client({
            brokerURL: 'ws://localhost:8888/ws-alerts-raw',
            onConnect: () => {
                console.log('Connected to STOMP');
                client.subscribe('/topic/process-alerts', (message) => {
                    if (message.body) {
                        const payload = JSON.parse(message.body);
                        toast.current?.show({ 
                            severity: 'info', 
                            summary: '실시간 공정 알림', 
                            detail: payload.message, 
                            life: 4000 
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


    const statusBodyTemplate = (rowData: any) => {
        if (rowData.status === 'CANCELLED') {
            return (
                <div className="flex flex-column gap-1">
                    <span className="p-badge p-badge-secondary">취소됨</span>
                    {rowData.cancellationFee > 0 && <small className="text-red-500 font-bold">위약금 ₩{rowData.cancellationFee.toLocaleString()}</small>}
                </div>
            );
        }
        
        let rawStage = rowData.stage || rowData.stageName || '접수';
        if (rawStage === 'PENDING') rawStage = '접수';
        else if (rawStage === 'CASTING') rawStage = '주물';
        else if (rawStage === 'POLISHING') rawStage = '세공';
        else if (rawStage === 'COMPLETED' || rawStage === 'DONE' || rowData.status === 'COMPLETED') {
            const lastStage = (pipelineStages && pipelineStages.length > 0) ? pipelineStages[pipelineStages.length - 1] : '완료';
            rawStage = (rowData.stage && rowData.stage !== 'COMPLETED' && rowData.stage !== 'DONE') ? rowData.stage : lastStage;
        }

        let matchedStep = (pipelineSteps && pipelineSteps.length > 0) ? pipelineSteps.find((step: any) => step.stageName === rawStage) : null;
        if (!matchedStep && pipelineSteps && pipelineSteps.length > 0) {
            matchedStep = pipelineSteps.find((step: any) => 
                step.stageName && step.stageName.trim().toLowerCase() === rawStage.trim().toLowerCase()
            );
        }
        if (!matchedStep && pipelineSteps && pipelineSteps.length > 0) {
            if (rawStage === 'COMPLETED' || rawStage === 'DONE' || rawStage === '완성') {
                matchedStep = pipelineSteps.find((step: any) => step.stageName === '완료' || step.stageName === 'COMPLETED');
            } else if (rawStage === 'PENDING') {
                matchedStep = pipelineSteps.find((step: any) => step.stageName === '접수' || step.stageName === 'PENDING');
            }
        }

        const bg = matchedStep ? (matchedStep.colorGradient || matchedStep.colorHex) : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';

        return (
            <span 
                className="px-3 py-1 text-white font-bold border-round text-xs shadow-1 inline-block"
                style={{ background: bg }}
            >
                {rawStage}
            </span>
        );
    };

    const toggleLanguage = () => {
        const currentLang = i18n.language || window.localStorage.getItem('i18nextLng') || 'ko';
        const nextLang = currentLang.startsWith('ko') ? 'en' : 'ko';
        i18n.changeLanguage(nextLang);
    };

    
    
    const handlePrint = async (order: any, mode: 'label' | 'invoice') => {
        if (!order) return;
        let mergedOrder = { ...order };
        
        try {
            const detailRes = await fetch(`http://localhost:8888/api/orders/${order.id}/details`, { headers: getAuthHeaders() });
            if (detailRes.ok) {
                const detailData = await detailRes.json();
                mergedOrder = { ...mergedOrder, ...detailData };
            }
        } catch (err) {
            console.error('Failed to fetch details for print:', err);
        }

        if (mode === 'invoice') {
            try {
                const res = await fetch(`http://localhost:8888/api/orders/${order.id}/invoice`, { headers: getAuthHeaders() });
                if (res.ok) {
                    const invoiceData = await res.json();
                    mergedOrder.invoice = invoiceData;
                }
            } catch (err) {
                console.error('Failed to fetch invoice data:', err);
            }
        }

        setPrintOrder(mergedOrder);
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
    
    
    const [goldPriceData, setGoldPriceData] = useState<any[]>([]);
    // --- Gold Price Display Logic ---
    const todayGold = goldPriceData.length > 0 ? goldPriceData[goldPriceData.length - 1] : { price24k: 0, price18k: 0, price14k: 0 };
    const yesterdayGold = goldPriceData.length > 1 ? goldPriceData[goldPriceData.length - 2] : todayGold;
    
    const delta24k = todayGold.price24k - yesterdayGold.price24k;
    const delta18k = todayGold.price18k - yesterdayGold.price18k;
    const delta14k = todayGold.price14k - yesterdayGold.price14k;

    const renderDelta = (delta: number) => {
        if (delta > 0) return <span className="text-red-500 text-sm font-bold">▲ {delta.toLocaleString()}</span>;
        if (delta < 0) return <span className="text-blue-500 text-sm font-bold">▼ {Math.abs(delta).toLocaleString()}</span>;
        return <span className="text-600 text-sm font-bold">-</span>;
    };
    // ---------------------------------

    return (
        <>
            <Toast ref={toast} />
            <div className="flex flex-column h-screen surface-ground no-print">
                {/* APM Header */}
                <div className="flex justify-content-between align-items-center px-4 py-3 surface-0 border-bottom-1 border-300 shadow-2">
                    <div className="flex align-items-center gap-3">
                        <img src="/logo.png" alt="KaratFlow Logo" style={{ width: '32px', height: '32px' }} />
                        <h2 className="m-0 text-xl font-bold text-900 tracking-tight">KaratFlow Gemini <span className="text-500 font-normal text-lg ml-2">통합 모니터링 대시보드</span></h2>
                    </div>
                    <div className="flex gap-2">
                        <Button label="새 주문 생성" icon="pi pi-plus" className="p-button-primary p-button-sm shadow-1" onClick={() => { setCreateOrderModalVisible(true); loadAllProducts(); }} />
                        <Button label="협력사 초대" icon="pi pi-users" className="p-button-outlined p-button-info p-button-sm" onClick={openHandshakeModal} />
                        <Button label="공정 관리" icon="pi pi-sitemap" className="p-button-outlined p-button-help p-button-sm" onClick={() => setProcessManagerVisible(true)} tooltip="공장 공정 단계를 커스터마이징합니다" tooltipOptions={{position: "bottom"}} />
                        
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
                    <div className="flex flex-column gap-3 overflow-y-auto" style={{ width: '450px', maxHeight: '100%' }}>
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

                        {/* 금 시세 (국내 시세 3.75g 기준 위젯) */}
                        <GoldWidget 
                            todayGold={todayGold} 
                            yesterdayGold={yesterdayGold} 
                            delta24k={delta24k} 
                            goldPriceData={goldPriceData} 
                            onOpenCalculator={() => setGoldToolsVisible(true)} 
                        />

                        {/* 2. 석유 시세 */}
                        <PetroleumChart />

                        {/* 3. 코스피 지수 */}
                        <KospiChart />
                    </div>

                    {/* Right Panel: Pipeline & Data Table */}
                    <div className="flex-1 flex flex-column gap-3 overflow-hidden">
                        
                        {/* Pipeline Visualizer */}
                        <div className="surface-0 p-3 border-round shadow-1">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <h4 className="m-0 text-600 font-medium">실시간 공정 현황 (Pipeline)</h4>
                                <Button 
                                    icon="pi pi-palette" 
                                    className="p-button-rounded p-button-text p-button-sm p-button-help" 
                                    onClick={() => setProcessManagerVisible(true)} 
                                    tooltip="공정 고유 색상 & 템플릿 커스터마이징" 
                                    tooltipOptions={{ position: 'left' }} 
                                />
                            </div>
                            <div className="flex justify-content-between align-items-center px-4 relative">
                                {/* Connecting Line */}
                                <div className="absolute w-full z-0" style={{ height: '4px', backgroundColor: '#e5e7eb', top: '30px', left: '0' }}></div>
                                
                                {pipelineSteps.map((stepObj: any, idx: number) => {
                                    const stage = stepObj.stageName;
                                    const count = orders.filter(o => {
                                        let s = o.stage || '접수';
                                        if (s === 'PENDING') s = '접수';
                                        else if (s === 'CASTING') s = '주물';
                                        else if (s === 'POLISHING') s = '세공';
                                        
                                        const isDone = (st: string) => st === '완성' || st === '완료' || st === 'COMPLETED' || st === 'DONE';
                                        if ((isDone(s) || o.status === 'COMPLETED') && isDone(stage)) {
                                            return true;
                                        }
                                        return s === stage;
                                    }).length;

                                    const bg = stepObj.colorGradient || stepObj.colorHex || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';

                                    return (
                                        <div key={stage} className="flex flex-column align-items-center z-1 relative bg-white" style={{ borderRadius: '50%' }}>
                                            <div 
                                                className="flex align-items-center justify-content-center border-circle mb-2 transition-transform transform hover:scale-110" 
                                                style={{ 
                                                    width: '60px', 
                                                    height: '60px', 
                                                    background: bg,
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                                                    border: '2px solid #ffffff'
                                                }}
                                            >
                                                <span className="text-2xl font-bold text-white drop-shadow">{count}</span>
                                            </div>
                                            <span className="text-800 font-bold bg-white px-2 border-round text-xs shadow-1" style={{ color: stepObj.colorHex || '#333' }}>{stage}</span>
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
                                <DataTable value={orders} size="small" paginator rows={10} selectionMode="single" selection={selectedOrderId === null ? null : orders.find(o => o.id === selectedOrderId)} onSelectionChange={(e) => { setSelectedOrderId(e.value?.id); if(e.value) openOrderDetail(e.value.id); }} dataKey="id" emptyMessage="등록된 주문이 없습니다." className="p-datatable-sm cursor-pointer" rowClassName={(row: any) => row.isHold ? 'hold-pulse-row' : 'surface-0 text-900 hover:surface-50 transition-colors transition-duration-200'}>
                                    <Column header="" style={{width:'52px'}} body={(row: any) => row.imageUrl ? (
                                    <Image src={`http://localhost:8888${row.imageUrl}`} alt="" width="36" height="36" preview style={{objectFit:'cover', borderRadius:'6px'}} />
                                ) : <span className="pi pi-image text-300" />} />
                                    <Column header="주문 번호" body={(r) => <span className="font-bold text-primary">#{r.orderNo || r.id}</span>} style={{ minWidth: '120px' }} />
                                    <Column header="수량" style={{width:'72px'}} body={(row: any) => <span className="font-bold text-700">{row.quantity ?? 1}건</span>} />
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
                                    <div key={ev.id} className="surface-50 p-3 border-round border-left-3 shadow-1 fadein animation-duration-300" style={{ borderLeftColor: getEventBorderColor(ev.message) }}>
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

                <CreateOrderModal
                    visible={createOrderModalVisible}
                    onHide={() => setCreateOrderModalVisible(false)}
                    createOrderForm={createOrderForm}
                    setCreateOrderForm={setCreateOrderForm}
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                    filteredProducts={filteredProducts}
                    searchProduct={searchProduct}
                    handleFileUpload={handleFileUpload}
                    submitCreateOrder={submitCreateOrder}
                />

                <ChangeRequestModal
                    visible={changeModalVisible}
                    onHide={() => setChangeModalVisible(false)}
                    submitChangeRequest={submitChangeRequest}
                />

                <CancelOrderModal
                    visible={cancelModalVisible}
                    onHide={() => setCancelModalVisible(false)}
                    cancelEstimate={cancelEstimate}
                    submitCancelOrder={submitCancelOrder}
                />

                <PartnerHandshakeModal
                    visible={partnerModalVisible}
                    onHide={() => setPartnerModalVisible(false)}
                    handshakes={handshakes}
                    handshakePin={handshakePin}
                    setHandshakePin={setHandshakePin}
                    generatedPin={generatedPin}
                    requestHandshake={requestHandshake}
                    verifyHandshake={verifyHandshake}
                    businessNumber={businessNumber}
                    setBusinessNumber={setBusinessNumber}
                    verifyBusiness={verifyBusiness}
                    businessResult={businessResult}
                />

                <SubcontractModal
                    visible={subcontractModalVisible}
                    onHide={() => setSubcontractModalVisible(false)}
                    subcontracts={subcontracts}
                    scForm={scForm}
                    setScForm={setScForm}
                    receiveForm={receiveForm}
                    setReceiveForm={setReceiveForm}
                    handleDispatchSubcontract={handleDispatchSubcontract}
                    handleReceiveSubcontract={handleReceiveSubcontract}
                />
            </div>



            {selectedOrderId && orders.find(o => o.id === selectedOrderId) && (() => {
                const currentOrder = orders.find(o => o.id === selectedOrderId);
                const isMultiItem = Boolean(
                    (currentOrder?.quantity && currentOrder.quantity > 1) || 
                    (orderDetailData?.workOrders && orderDetailData.workOrders.length > 1)
                );

                return isMultiItem ? (
                    <MultiOrderDetailModal
                        visible={orderDetailVisible}
                        onHide={() => setOrderDetailVisible(false)}
                        order={currentOrder}
                        orderDetailData={orderDetailData}
                        pipelineStages={pipelineStages}
                        pipelineSteps={pipelineSteps}
                        advanceStage={advanceStage}
                        openSubcontractModal={(id) => { setOrderDetailVisible(false); openSubcontractModal(id); }}
                        openChangeModal={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }}
                        openCancelModal={(id) => { setOrderDetailVisible(false); openCancelModal(id); }}
                        handlePrint={handlePrint}
                        statusBodyTemplate={statusBodyTemplate}
                    />
                ) : (
                    <OrderDetailModal
                        visible={orderDetailVisible}
                        onHide={() => setOrderDetailVisible(false)}
                        order={currentOrder}
                        orderDetailData={orderDetailData}
                        pipelineStages={pipelineStages}
                        pipelineSteps={pipelineSteps}
                        advanceStage={advanceStage}
                        openSubcontractModal={(id) => { setOrderDetailVisible(false); openSubcontractModal(id); }}
                        openChangeModal={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }}
                        openCancelModal={(id) => { setOrderDetailVisible(false); openCancelModal(id); }}
                        handlePrint={handlePrint}
                        statusBodyTemplate={statusBodyTemplate}
                    />
                );
            })()}

            <ProcessManager 
                visible={processManagerVisible} 
                onHide={() => {
                    setProcessManagerVisible(false);
                    fetchOrders();
                    fetchPipelineStages();
                }} 
            />

            {/* Print Views */}
            {printOrder && printMode === 'label' && (
                <div className="print-mode-label">
                    <div style={{ borderBottom: '1px solid #000', paddingBottom: '1mm', marginBottom: '1mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '9pt' }}>KaratFlow</span>
                        <span style={{ fontSize: '8pt', fontFamily: 'monospace' }}>{printOrder.orderNo || `KF-${printOrder.id}`}</span>
                    </div>
                    <div style={{ fontSize: '8pt', lineHeight: '1.3' }}>
                        <div><strong>고객명:</strong> {printOrder.customerName || '-'}</div>
                        <div><strong>브랜드:</strong> {printOrder.brand || '-'}</div>
                        <div><strong>제품명:</strong> {printOrder.productName || printOrder.unmappedProductName || printOrder.design || '-'}</div>
                        <div><strong>마감/수량:</strong> {printOrder.surfaceFinish || '유광'} / {printOrder.quantity || 1}개</div>
                    </div>
                    {printOrder.engravingText && (
                        <div className="engraving-highlight">
                            각인: {printOrder.engravingText} {printOrder.engravingLocation ? `(${printOrder.engravingLocation})` : ''}
                        </div>
                    )}
                </div>
            )}

            {printOrder && printMode === 'invoice' && (
                <div className="print-mode-invoice">
                    {/* Header Metadata Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9pt', color: '#444', marginBottom: '4mm' }}>
                        <span style={{ fontWeight: 'bold' }}>[서식 제2026-KF09호]</span>
                        <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>문서관리번호: KF-DOC-{printOrder.id}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}</span>
                    </div>

                    {/* Main Document Title */}
                    <div style={{ textAlign: 'center', marginBottom: '8mm', borderBottom: '3px double #000', paddingBottom: '4mm' }}>
                        <h1 style={{ fontSize: '22pt', margin: 0, letterSpacing: '4px', fontWeight: 'bold', color: '#000' }}>
                            {printOrder.orderType === 'B2B' ? '공 식 거 래 명 세 표 ( 도 매 용 )' : '품 질 보 증 서 및 정 산 명 세 서'}
                        </h1>
                        <div style={{ fontSize: '9.5pt', color: '#555', marginTop: '2mm', letterSpacing: '0.5px' }}>
                            ( 귀금속 통합 제작 공정 관리 시스템 K-APM 공식 인증 문서 )
                        </div>
                    </div>
                    
                    {/* Legal Provider / Receiver Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '9.5pt' }}>
                        <tbody>
                            <tr>
                                <th rowSpan={4} style={{ width: '4%', backgroundColor: '#f1f3f5', border: '1px solid #000', textAlign: 'center', writingMode: 'vertical-rl', letterSpacing: '3px' }}>공급자</th>
                                <td style={{ width: '13%', backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>사업자번호</td>
                                <td style={{ width: '33%', border: '1px solid #000', padding: '5px 8px' }}>124-81-99881</td>
                                <th rowSpan={4} style={{ width: '4%', backgroundColor: '#f1f3f5', border: '1px solid #000', textAlign: 'center', writingMode: 'vertical-rl', letterSpacing: '3px' }}>공급받는자</th>
                                <td style={{ width: '13%', backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>주문번호</td>
                                <td style={{ width: '33%', border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', color: '#1d4ed8' }}>{printOrder.orderNo || `KF-${printOrder.id}`}</td>
                            </tr>
                            <tr>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>상호(법인명)</td>
                                <td style={{ border: '1px solid #000', padding: '5px 8px' }}>KaratFlow Jewelry (주)</td>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>성명 / 상호</td>
                                <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>{printOrder.customerName || '지정되지 않음'}</td>
                            </tr>
                            <tr>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>성명(대표자)</td>
                                <td style={{ border: '1px solid #000', padding: '5px 8px' }}>홍 길 동 (인)</td>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>연락처</td>
                                <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{printOrder.customerPhone || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>사업장 주소</td>
                                <td style={{ border: '1px solid #000', padding: '5px 8px' }}>서울시 종로구 돈화문로 11길 15</td>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>발행일시</td>
                                <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{new Date().toLocaleString('ko-KR')}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Table of Items */}
                    <div style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '2mm', display: 'flex', justifyContent: 'space-between', borderLeft: '3px solid #000', paddingLeft: '6px' }}>
                        <span>1. 품목 및 주문 규격 명세</span>
                        <span style={{ fontSize: '9pt', fontWeight: 'normal', color: '#666' }}>단위: 원(KRW), VAT 포함</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '9.5pt' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#e9ecef', textAlign: 'center' }}>
                                <th style={{ border: '1px solid #000', padding: '6px', width: '6%' }}>No.</th>
                                <th style={{ border: '1px solid #000', padding: '6px', width: '14%' }}>브랜드</th>
                                <th style={{ border: '1px solid #000', padding: '6px', width: '28%' }}>품명 및 디자인 규격</th>
                                <th style={{ border: '1px solid #000', padding: '6px', width: '12%' }}>표면 마감</th>
                                <th style={{ border: '1px solid #000', padding: '6px', width: '20%' }}>각인 문구 (위치)</th>
                                <th style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>수량</th>
                                <th style={{ border: '1px solid #000', padding: '6px', width: '12%' }}>금액</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ textAlign: 'center' }}>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>1</td>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>{printOrder.brand || '-'}</td>
                                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                                    <strong>{printOrder.productName || printOrder.unmappedProductName || printOrder.design || '-'}</strong>
                                </td>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>{printOrder.surfaceFinish || '유광'}</td>
                                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                                    {printOrder.engravingText ? `${printOrder.engravingText} (${printOrder.engravingLocation || '기본'})` : '없음'}
                                </td>
                                <td style={{ border: '1px solid #000', padding: '6px' }}>{printOrder.quantity || 1} EA</td>
                                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {printOrder.finalConsumerPrice ? `₩${printOrder.finalConsumerPrice.toLocaleString()}` : '-'}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                                <td colSpan={5} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>합 계 (TOTAL)</td>
                                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{printOrder.quantity || 1} EA</td>
                                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', color: '#166534', fontSize: '10.5pt' }}>
                                    {printOrder.finalConsumerPrice ? `₩${printOrder.finalConsumerPrice.toLocaleString()}` : '-'}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* B2B Detailed Gold & Labor Settlement Block */}
                    {printOrder.invoice && printOrder.orderType === 'B2B' && (
                        <div style={{ marginBottom: '6mm' }}>
                            <div style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '2mm', borderLeft: '3px solid #000', paddingLeft: '6px' }}>2. B2B 정밀 귀금속 및 공임 정산 명세</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', width: '20%', padding: '5px' }}>적용 시세 (기준일)</td>
                                        <td style={{ border: '1px solid #000', width: '30%', padding: '5px' }}>₩{printOrder.invoice.goldPricePer375g?.toLocaleString()} / 3.75g ({printOrder.invoice.priceDate})</td>
                                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', width: '20%', padding: '5px' }}>출고 실측 중량</td>
                                        <td style={{ border: '1px solid #000', width: '30%', padding: '5px' }}>{printOrder.invoice.completedWeightG} g</td>
                                    </tr>
                                    <tr>
                                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>스톤 차감 중량</td>
                                        <td style={{ border: '1px solid #000', padding: '5px' }}>{printOrder.invoice.stoneWeightG} g</td>
                                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>정산 기준 중량 (해리 {printOrder.invoice.lossRatePercent}%)</td>
                                        <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{printOrder.invoice.settlementBaseWeightG?.toFixed(3)} g</td>
                                    </tr>
                                    <tr>
                                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>산출 금 재료비</td>
                                        <td style={{ border: '1px solid #000', padding: '5px' }}>₩{printOrder.invoice.calculatedGoldPrice?.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>원청 기본 공임비</td>
                                        <td style={{ border: '1px solid #000', padding: '5px' }}>₩{printOrder.invoice.baseLaborFee?.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>스톤 세팅 공임비</td>
                                        <td style={{ border: '1px solid #000', padding: '5px' }}>₩{printOrder.invoice.stoneFee?.toLocaleString()}</td>
                                        <td style={{ backgroundColor: '#fee2e2', border: '1px solid #000', fontWeight: 'bold', padding: '5px', color: '#991b1b' }}>최종 정산 청구 금액</td>
                                        <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', fontSize: '11pt', color: '#991b1b' }}>
                                            ₩{printOrder.invoice.finalBillingAmount?.toLocaleString(undefined, {maximumFractionDigits:0})} 원
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {/* Legal Quality Assurance & Official Stamp Box */}
                    <div style={{ border: '2px solid #000', padding: '6mm', marginTop: '6mm', backgroundColor: '#ffffff', position: 'relative' }}>
                        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11pt', marginBottom: '3mm', letterSpacing: '2px' }}>
                            [ 품 질 보 증 및 서 명 직 인 ]
                        </div>
                        <p style={{ fontSize: '9pt', lineHeight: '1.6', color: '#333', textAlign: 'justify', margin: 0 }}>
                            본 문서는 귀금속 통합 제작 공정 시스템(KaratFlow APM System)에서 공정별 정밀 검수 완료 후 공식 발행된 서류입니다.
                            본 서류에 기재된 순도, 실측 중량 및 제품 사양은 국가 표준 귀금속 품질 보증 규정에 의거하여 정품임을 철저히 보증하며, 무단 복제 및 변조를 금합니다.
                        </p>
                        
                        <div style={{ marginTop: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '9.5pt' }}>
                                <div><strong>발행일자:</strong> {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                <div><strong>발행기관:</strong> KaratFlow Jewelry 주식회사</div>
                            </div>
                            
                            {/* Red Official Seal Graphic / Stamp Container */}
                            <div style={{ textAlign: 'right', position: 'relative', paddingRight: '10px' }}>
                                <div style={{ fontSize: '11pt', fontWeight: 'bold', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                                    <span>발행원 / 대표이사 홍 길 동</span>
                                    <span style={{ 
                                        display: 'inline-block', 
                                        width: '42px', 
                                        height: '42px', 
                                        borderRadius: '50%', 
                                        border: '2px double #dc2626', 
                                        color: '#dc2626', 
                                        fontSize: '9pt', 
                                        fontWeight: 'bold', 
                                        lineHeight: '38px', 
                                        textAlign: 'center',
                                        transform: 'rotate(-5deg)'
                                    }}>
                                        직인
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* @ts-ignore */}
            <ProcessManager visible={processManagerVisible} onHide={() => setProcessManagerVisible(false)} />
            {/* @ts-ignore */}
            <GoldToolsModal visible={goldToolsVisible} onHide={() => setGoldToolsVisible(false)} recentPrices={goldPriceData} />
        </>
    );
}

export default App;
