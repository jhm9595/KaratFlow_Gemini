import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import PrintView from './components/print/PrintView';
import { useOrderPrint } from './hooks/useOrderPrint';
import { getAuthHeaders } from './api/client';
import { OrderTable } from './components/orders/OrderTable';
import { DashboardSidebar } from './components/dashboard/DashboardSidebar';
import { PipelineOverview } from './components/pipeline/PipelineOverview';
import { LiveEventFeed } from './components/events/LiveEventFeed';
import { AppModals } from './components/AppModals';
import { useGoldPrices } from './hooks/useGoldPrices';
import { useProcessTemplates } from './hooks/useProcessTemplates';
import { Client } from '@stomp/stompjs';
import i18n from './i18n';



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
    const { goldPriceData, todayGold, yesterdayGold, delta24k } = useGoldPrices();
    const { templates } = useProcessTemplates();
    const [feedViewMode, setFeedViewMode] = useState<'list' | 'card'>('list');

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

    const getEventStageInfo = (msg: string) => {
        if (!msg) return { stageName: '알림', colorHex: '#3B82F6', colorGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', bgColor: '#eff6ff' };
        
        let matchedStep = (pipelineSteps && pipelineSteps.length > 0) 
            ? pipelineSteps.find((step: any) => step.stageName && msg.includes(step.stageName)) 
            : null;

        if (!matchedStep) {
            if (msg.includes('접수') || msg.includes('신규')) {
                matchedStep = { stageName: '접수', colorHex: '#38BDF8', colorGradient: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)', bgColor: '#f0f9ff' };
            } else if (msg.includes('CAD')) {
                matchedStep = { stageName: 'CAD', colorHex: '#C084FC', colorGradient: 'linear-gradient(135deg, #e879f9 0%, #c084fc 100%)', bgColor: '#fdf4ff' };
            } else if (msg.includes('주물')) {
                matchedStep = { stageName: '주물', colorHex: '#F59E0B', colorGradient: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)', bgColor: '#fffbeb' };
            } else if (msg.includes('세공')) {
                matchedStep = { stageName: '세공', colorHex: '#EF4444', colorGradient: 'linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)', bgColor: '#fef2f2' };
            } else if (msg.includes('완료') || msg.includes('완성')) {
                matchedStep = { stageName: '완료', colorHex: '#22C55E', colorGradient: 'linear-gradient(135deg, #86efac 0%, #22c55e 100%)', bgColor: '#f0fdf4' };
            } else if (msg.includes('보류') || msg.includes('HOLD')) {
                matchedStep = { stageName: '보류', colorHex: '#EAB308', colorGradient: 'linear-gradient(135deg, #fde047 0%, #eab308 100%)', bgColor: '#fefce8' };
            }
        }

        if (matchedStep) {
            return {
                stageName: matchedStep.stageName || '공정',
                colorHex: matchedStep.colorHex || '#3B82F6',
                colorGradient: matchedStep.colorGradient || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                bgColor: matchedStep.bgColor || '#f8fafc'
            };
        }

        return { stageName: '알림', colorHex: '#3B82F6', colorGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', bgColor: '#eff6ff' };
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
    
    const [_liveEvents, _setLiveEvents] = useState<any[]>([]);
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
    const { printOrder, printMode, handlePrint } = useOrderPrint(getAuthHeaders);

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

    const fetchNotifications = () => {
        fetch('http://localhost:8888/api/notifications', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const mapped = data.map((n: any) => ({
                        ...n,
                        time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                    }));
                    _setLiveEvents(mapped);
                }
            })
            .catch(err => console.error('Failed to fetch notifications:', err));
    };

    const handleNotificationClick = (ev: any) => {
        if (!ev.isRead) {
            fetch(`http://localhost:8888/api/notifications/${ev.id}/read`, { method: 'POST', headers: getAuthHeaders() })
                .then(() => {
                    _setLiveEvents(prev => prev.map(item => item.id === ev.id ? { ...item, isRead: true } : item));
                })
                .catch(err => console.error('Failed to mark notification as read:', err));
        }

        if (ev.orderId) {
            setSelectedOrderId(ev.orderId);
            openOrderDetail(ev.orderId);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchPipelineStages();
        fetchNotifications();

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
                        const newEv = {
                            ...payload,
                            time: payload.createdAt ? new Date(payload.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                        };
                        _setLiveEvents(prev => [newEv, ...prev.filter(item => item.id !== newEv.id)].slice(0, 50));
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

    
    


    
    

    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 주물: 4.5, 세공: 8.2 },
        { date: '08/18', CAD: 2.4, 주물: 4.2, 세공: 9.1 },
        { date: '08/19', CAD: 1.8, 주물: 5.0, 세공: 12.5 }, 
        { date: '08/20', CAD: 2.5, 주물: 4.1, 세공: 10.8 },
        { date: '08/21', CAD: 2.0, 주물: 4.8, 세공: 8.5 },
        { date: '08/22', CAD: 2.2, 주물: 4.4, 세공: 8.0 },
        { date: '08/23', CAD: 1.9, 주물: 4.0, 세공: 7.5 }
    ];

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
                    <DashboardSidebar 
                        orders={orders}
                        todayGold={todayGold}
                        yesterdayGold={yesterdayGold}
                        delta24k={delta24k}
                        goldPriceData={goldPriceData}
                        onOpenGoldTools={() => setGoldToolsVisible(true)}
                    />

                    {/* Right Panel: Pipeline & Data Table */}
                    <div className="flex-1 flex flex-column gap-3 overflow-hidden">
                        
                        {/* Pipeline Visualizer */}
                        <PipelineOverview 
                            orders={orders}
                            pipelineSteps={pipelineSteps}
                            templates={templates}
                        />

                        {/* Enhanced Data Table */}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column overflow-hidden">
                            <h4 className="m-0 mb-3 text-600 font-medium">상세 주문 모니터링</h4>
                            <div className="flex-1 overflow-auto custom-dark-table pb-3">
                                <OrderTable 
                                    orders={orders}
                                    selectedOrderId={selectedOrderId}
                                    onSelectOrder={(id) => setSelectedOrderId(id)}
                                    onOpenOrderDetail={(id) => openOrderDetail(id)}
                                    pipelineSteps={pipelineSteps}
                                    pipelineStages={pipelineStages}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Live Feed */}
                    <LiveEventFeed 
                        events={_liveEvents}
                        feedViewMode={feedViewMode}
                        onFeedViewModeChange={(mode) => setFeedViewMode(mode)}
                        onEventClick={(ev) => handleNotificationClick(ev)}
                        pipelineSteps={pipelineSteps}
                    />
                </div>
            </div>

            <AppModals 
                createOrderModalVisible={createOrderModalVisible}
                setCreateOrderModalVisible={setCreateOrderModalVisible}
                createOrderForm={createOrderForm}
                setCreateOrderForm={setCreateOrderForm}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                filteredProducts={filteredProducts}
                searchProduct={searchProduct}
                handleFileUpload={handleFileUpload}
                submitCreateOrder={submitCreateOrder}

                changeModalVisible={changeModalVisible}
                setChangeModalVisible={setChangeModalVisible}
                submitChangeRequest={submitChangeRequest}

                cancelModalVisible={cancelModalVisible}
                setCancelModalVisible={setCancelModalVisible}
                cancelEstimate={cancelEstimate}
                submitCancelOrder={submitCancelOrder}

                partnerModalVisible={partnerModalVisible}
                setPartnerModalVisible={setPartnerModalVisible}
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

                subcontractModalVisible={subcontractModalVisible}
                setSubcontractModalVisible={setSubcontractModalVisible}
                subcontracts={subcontracts}
                scForm={scForm}
                setScForm={setScForm}
                receiveForm={receiveForm}
                setReceiveForm={setReceiveForm}
                handleDispatchSubcontract={handleDispatchSubcontract}
                handleReceiveSubcontract={handleReceiveSubcontract}

                selectedOrderId={selectedOrderId}
                orders={orders}
                orderDetailVisible={orderDetailVisible}
                setOrderDetailVisible={setOrderDetailVisible}
                orderDetailData={orderDetailData}
                pipelineStages={pipelineStages}
                pipelineSteps={pipelineSteps}
                advanceStage={advanceStage}
                openSubcontractModal={openSubcontractModal}
                openCancelModal={openCancelModal}
                handlePrint={handlePrint}

                processManagerVisible={processManagerVisible}
                setProcessManagerVisible={setProcessManagerVisible}
                fetchOrders={fetchOrders}
                fetchPipelineStages={fetchPipelineStages}

                goldToolsVisible={goldToolsVisible}
                setGoldToolsVisible={setGoldToolsVisible}
                goldPriceData={goldPriceData}
                templates={templates}
            />

            {/* Print Views */}
            <PrintView printOrder={printOrder} printMode={printMode} />
        </>
    );
}

export default App;
