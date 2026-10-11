import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
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
import { AppSidebar } from './components/navigation/AppSidebar';
import { CustomerAdminPage } from './pages/CustomerAdminPage';
import { KakaoGuidePage } from './pages/KakaoGuidePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { OrderAdminPage } from './pages/OrderAdminPage';
import { UserAccountPage } from './pages/UserAccountPage';
import { compressImage } from './utils/imageCompressor';


function App() {
    const { goldPriceData, todayGold, yesterdayGold, delta24k } = useGoldPrices();
    const { templates } = useProcessTemplates();
    const [feedViewMode, setFeedViewMode] = useState<'list' | 'card'>('list');
    const toast = useRef<any>(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [activeMenu, setActiveMenu] = useState('dashboard');
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

    const [selectedOrderFile, setSelectedOrderFile] = useState<File | null>(null);
    const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);

    const handleFileUpload = async (e: any) => {
        const file = e.target?.files?.[0] || e.files?.[0];
        if (!file) return;

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: '파일 용량 초과', 
                detail: `선택하신 파일(${(file.size / (1024 * 1024)).toFixed(1)}MB)이 10MB를 초과합니다. 10MB 이하의 이미지 파일만 첨부 가능합니다.`, 
                life: 4000 
            });
            if (e.target) e.target.value = '';
            return;
        }

        try {
            // Compress image client-side before upload
            const compressed = await compressImage(file, 1024, 1024, 0.82);
            setSelectedOrderFile(compressed);

            if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
            }
            const previewUrl = URL.createObjectURL(compressed);
            setLocalImagePreview(previewUrl);

            toast.current?.show({ 
                severity: 'info', 
                summary: '이미지 선택 완료', 
                detail: `이미지 미리보기가 적용되었습니다. (최적화 용량: ${(compressed.size / 1024).toFixed(0)}KB)`, 
                life: 3000 
            });
        } catch (err) {
            console.error('Failed to process image locally', err);
            toast.current?.show({ severity: 'error', summary: '이미지 처리 실패', detail: '이미지 최적화 중 오류가 발생했습니다.', life: 3000 });
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

    const submitCreateOrder = async () => {
        let finalImageUrl = createOrderForm.imageUrl || '';

        // If user attached a local file, upload it now upon submitting the order (Pattern B)
        if (selectedOrderFile) {
            try {
                const formData = new FormData();
                formData.append('file', selectedOrderFile);
                const token = localStorage.getItem('access_token') || localStorage.getItem('jwtToken');
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const uploadRes = await fetch('http://localhost:8888/api/uploads', {
                    method: 'POST',
                    headers,
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    finalImageUrl = uploadData.url;
                } else {
                    console.error('Image upload failed during submit', uploadRes.status);
                    toast.current?.show({ severity: 'error', summary: '이미지 업로드 실패', detail: `이미지 저장 실패 (${uploadRes.status})`, life: 3000 });
                }
            } catch (err) {
                console.error('Image upload network error', err);
            }
        }

        const payload = {
            ...createOrderForm,
            imageUrl: finalImageUrl
        };

        fetch('http://localhost:8888/api/orders', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(() => {
            fetchOrders();
            setCreateOrderModalVisible(false);
            setSelectedOrderFile(null);
            if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
                setLocalImagePreview(null);
            }
            setCreateOrderForm({ orderType: 'B2C', customerName: '', customerPhone: '', designId: 1, engravingText: '', engravingLocation: '', surfaceFinish: '유광', finalConsumerPrice: 0 });
            toast.current?.show({ severity: 'success', summary: '주문 생성 완료', detail: '새로운 주문이 시스템에 등록되었습니다.', life: 3000 });
        })
        .catch(err => {
            console.error('Order creation failed', err);
            toast.current?.show({ severity: 'error', summary: '주문 생성 실패', detail: '주문 등록 중 오류가 발생했습니다.', life: 3000 });
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



    
    


    
    



    return (
        <>
            <Toast ref={toast} />

            {/* Left Collapsible Drawer Navigation Sidebar */}
            <AppSidebar 
                visible={sidebarVisible} 
                onHide={() => setSidebarVisible(false)} 
                activeMenu={activeMenu} 
                onSelectMenu={(menuKey) => setActiveMenu(menuKey)} 
            />

            <div className="flex flex-column h-screen surface-ground no-print">
                {/* Header */}
                <div className="flex justify-content-between align-items-center px-4 py-3 surface-0 border-bottom-1 border-300 shadow-2">
                    <div className="flex align-items-center gap-3">
                        <Button 
                            icon="pi pi-bars" 
                            className="p-button-text p-button-plain p-button-lg text-800" 
                            onClick={() => setSidebarVisible(true)} 
                            tooltip="메뉴 열기" 
                            tooltipOptions={{ position: 'bottom' }} 
                        />
                        <img src="/logo.png" alt="KaratFlow Logo" style={{ width: '32px', height: '32px' }} />
                        <h2 className="m-0 text-xl font-bold text-900 tracking-tight cursor-pointer" onClick={() => setActiveMenu('dashboard')}>
                            KaratFlow
                        </h2>
                    </div>
                    <div className="flex gap-2 align-items-center">
                        <Button 
                            label="새 주문 생성" 
                            icon="pi pi-plus" 
                            className="p-button-primary p-button-sm shadow-1" 
                            onClick={() => { 
                                setSelectedOrderFile(null);
                                if (localImagePreview) setLocalImagePreview(null);
                                setCreateOrderForm({ orderType: 'B2C', customerName: '', customerPhone: '', designId: 1, engravingText: '', engravingLocation: '', surfaceFinish: '유광', finalConsumerPrice: 0, quantity: 1, unmappedBrandName: '', unmappedProductName: '', imageUrl: '' });
                                setSelectedProduct(null);
                                setCreateOrderModalVisible(true); 
                                loadAllProducts(); 
                            }} 
                        />
                        <Button label="협력사 초대" icon="pi pi-users" className="p-button-outlined p-button-info p-button-sm" onClick={openHandshakeModal} />
                        <Button label="공정 관리" icon="pi pi-sitemap" className="p-button-outlined p-button-help p-button-sm" onClick={() => setProcessManagerVisible(true)} tooltip="공장 공정 단계를 커스터마이징합니다" tooltipOptions={{position: "bottom"}} />
                        
                        <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                            <div 
                                onClick={() => setActiveMenu('account')} 
                                className="w-2rem h-2rem border-circle bg-primary flex align-items-center justify-content-center text-white font-bold text-sm cursor-pointer shadow-1"
                                title="계정 및 소셜 연동 관리"
                            >
                                <i className="pi pi-user"></i>
                            </div>
                            <span className="text-700 font-bold text-sm cursor-pointer" onClick={() => setActiveMenu('account')}>로그인됨</span>
                            <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger ml-2" aria-label="Logout" tooltip="로그아웃" tooltipOptions={{position: 'bottom'}} onClick={() => { localStorage.removeItem('jwtToken'); window.location.href = '/login'; }} />
                        </div>
                    </div>
                </div>

                {/* Main Content Area based on activeMenu */}
                {activeMenu === 'dashboard' && (
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
                            {(!templates || templates.length === 0) && (
                                <div className="surface-0 p-2.5 px-3 border-round-lg border-1 border-amber-300 bg-amber-50 flex align-items-center justify-content-between shadow-1">
                                    <div className="flex align-items-center gap-2">
                                        <i className="pi pi-sitemap text-amber-600 text-base font-bold"></i>
                                        <span className="font-semibold text-amber-900 text-sm">공정 템플릿이 없습니다. 주문 등록 전 템플릿을 먼저 추가해 주세요.</span>
                                    </div>
                                    <Button 
                                        label="+ 템플릿 등록" 
                                        icon="pi pi-plus" 
                                        className="p-button-warning p-button-xs font-bold text-xs shadow-1" 
                                        style={{ height: '28px', padding: '0 10px' }}
                                        onClick={() => setProcessManagerVisible(true)} 
                                    />
                                </div>
                            )}
                            
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
                )}

                {activeMenu === 'customer' && <CustomerAdminPage />}
                {activeMenu === 'orders' && (
                    <OrderAdminPage 
                        orders={orders} 
                        onOpenOrderDetail={(id) => openOrderDetail(id)} 
                        pipelineSteps={pipelineSteps} 
                        pipelineStages={pipelineStages} 
                    />
                )}
                {activeMenu === 'analytics' && <AnalyticsPage />}
                {activeMenu === 'kakao-guide' && <KakaoGuidePage companyId={101} />}
                {activeMenu === 'account' && <UserAccountPage />}
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
                localImagePreview={localImagePreview}

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
