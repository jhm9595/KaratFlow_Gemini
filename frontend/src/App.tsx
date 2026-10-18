import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { useModal } from './hooks/useModal';
import { API_BASE_URL, getWsBrokerUrl } from './config/apiConfig';
import { isOrderCancelled } from './utils/orderStatus';

const MENU_PATH_MAP: Record<string, string> = {
    'dashboard': '/',
    'customer': '/customer',
    'orders': '/orders',
    'analytics': '/analytics',
    'kakao-guide': '/kakao-guide',
    'account': '/account'
};

const getMenuFromPathname = (pathname: string): string => {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    if (cleanPath === '/' || cleanPath === '/dashboard') return 'dashboard';
    if (cleanPath === '/orders') return 'orders';
    if (cleanPath === '/customer' || cleanPath === '/customers') return 'customer';
    if (cleanPath === '/analytics') return 'analytics';
    if (cleanPath === '/kakao-guide') return 'kakao-guide';
    if (cleanPath === '/account') return 'account';
    return 'dashboard';
};

function App() {
    const { openModal, closeModal } = useModal();
    const { goldPriceData, todayGold, yesterdayGold, delta24k } = useGoldPrices();
    const { templates } = useProcessTemplates();
    const [feedViewMode, setFeedViewMode] = useState<'list' | 'card'>('list');
    const toast = useRef<any>(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [activeMenu, setActiveMenu] = useState<string>(() => getMenuFromPathname(location.pathname));

    // 브라우저 뒤로가기/앞으로가기 또는 URL 직접 변경 시 activeMenu 동기화
    useEffect(() => {
        const currentMenu = getMenuFromPathname(location.pathname);
        if (currentMenu !== activeMenu) {
            setActiveMenu(currentMenu);
        }
    }, [location.pathname, activeMenu]);

    // 메뉴 선택 시 activeMenu 변경 및 브라우저 URL 이동
    const handleSelectMenu = useCallback((menuKey: string) => {
        setActiveMenu(menuKey);
        const targetPath = MENU_PATH_MAP[menuKey] || '/';
        if (location.pathname !== targetPath) {
            navigate(targetPath);
        }
    }, [location.pathname, navigate]);

    const [orders, setOrders] = useState<any[]>([]);

    const dashboardOrders = useMemo(() => {
        return orders.filter(o => !isOrderCancelled(o));
    }, [orders]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [pipelineStages, setPipelineStages] = useState<string[]>([]);
    const [pipelineSteps, setPipelineSteps] = useState<any[]>([]);

    const fetchPipelineStages = () => {
        fetch(`${API_BASE_URL}/api/process-templates`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then((templates: any[]) => {
                if (Array.isArray(templates) && templates.length > 0) {
                    const defaultTpl = templates.find(t => t.isDefault) || templates[0];
                    if (defaultTpl && defaultTpl.steps && defaultTpl.steps.length > 0) {
                        setPipelineSteps(defaultTpl.steps);
                        const stages = defaultTpl.steps.map((s: any) => s.stageName || s.stageCode);
                        setPipelineStages(stages);
                        return;
                    }
                }
                setPipelineSteps([]);
                setPipelineStages([]);
            })
            .catch(err => {
                console.error('Failed to fetch pipeline stages:', err);
                setPipelineSteps([]);
                setPipelineStages([]);
            });
    };

    // Load all products once for AutoComplete suggestions
    const loadAllProducts = () => {
        fetch(`${API_BASE_URL}/api/products`, { headers: getAuthHeaders() })
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

    const [orderDetailData, setOrderDetailData] = useState<any>(null);

    const openOrderDetail = (orderId: number) => {
        setSelectedOrderId(orderId);
        fetch(`${API_BASE_URL}/api/orders/${orderId}/details`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setOrderDetailData(data);
                openModal('orderDetail', { orderId });
            })
            .catch(err => {
                console.error('Failed to fetch details', err);
                openModal('orderDetail', { orderId });
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

    const [cancelEstimate, setCancelEstimate] = useState<number | null>(null);
    const [subcontracts, setSubcontracts] = useState<any[]>([]);
    const [scForm, setScForm] = useState({ taskName: '', subcontractorName: '', dispatchedWeightG: 0, agreedLaborFee: 0 });
    const [receiveForm, setReceiveForm] = useState<{ [key: number]: number }>({});

    const [handshakes, setHandshakes] = useState<any[]>([]);
    const [handshakePin, setHandshakePin] = useState('');
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);
    const [businessNumber, setBusinessNumber] = useState('');
    const [businessResult, setBusinessResult] = useState<any>(null);

    const openHandshakeModal = () => {
        fetch(`${API_BASE_URL}/api/handshake`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setHandshakes(data);
                openModal('partnerHandshake');
            });
    };

    const requestHandshake = () => {
        fetch(`${API_BASE_URL}/api/handshake/request`, { method: 'POST', headers: getAuthHeaders() })
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

                const uploadRes = await fetch(`${API_BASE_URL}/api/uploads`, {
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

        fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(() => {
            fetchOrders();
            closeModal('createOrder');
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
        fetch(`${API_BASE_URL}/api/handshake/verify`, {
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
        fetch(`${API_BASE_URL}/api/business/verify`, {
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
        fetch(`${API_BASE_URL}/api/orders/${orderId}/subcontracts`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setSubcontracts(data);
                openModal('subcontract', { orderId });
            });
    };

    const handleDispatchSubcontract = () => {
        fetch(`${API_BASE_URL}/api/orders/${selectedOrderId}/subcontracts/dispatch`, {
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
            fetch(`${API_BASE_URL}/api/orders/${selectedOrderId}/subcontracts/${taskId}/receive`, {
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
        fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel-estimate`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setCancelEstimate(data.estimatedFee);
                openModal('cancelOrder', { orderId });
            });
    };

    const submitCancelOrder = () => {
        if (!selectedOrderId) return;
        fetch(`${API_BASE_URL}/api/orders/${selectedOrderId}/cancel`, { method: 'POST', headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                toast.current?.show({ severity: 'success', summary: '주문 취소 완료', detail: `수수료: ₩${data.cancellationFee}`, life: 5000 });
                closeModal('cancelOrder');
                fetchOrders();
            });
    };

    const advanceStage = (orderId: number) => {
        fetch(`${API_BASE_URL}/api/orders/${orderId}/advance-stage`, { method: 'POST', headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'error' || (data.message && data.message.includes('템플릿'))) {
                    toast.current?.show({ 
                        severity: 'warn', 
                        summary: '공정 템플릿 추가 안내', 
                        detail: '공정 진행을 위해 템플릿 등록이 필요합니다. [공정 관리] 모달을 엽니다.', 
                        life: 4000 
                    });
                    openModal('processManager');
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
                openModal('processManager');
            });
    };

    const advanceWorkOrderStage = (workOrderId: number) => {
        fetch(`${API_BASE_URL}/api/work-orders/${workOrderId}/advance-stage`, { method: 'POST', headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'error' || (data.message && data.message.includes('템플릿'))) {
                    toast.current?.show({ 
                        severity: 'warn', 
                        summary: '공정 템플릿 추가 안내', 
                        detail: '공정 진행을 위해 템플릿 등록이 필요합니다. [공정 관리] 모달을 엽니다.', 
                        life: 4000 
                    });
                    openModal('processManager');
                } else {
                    fetchOrders();
                    if (selectedOrderId) {
                        openOrderDetail(selectedOrderId);
                    }
                }
            })
            .catch((_err) => {
                toast.current?.show({ 
                    severity: 'error', 
                    summary: '공정 진행 실패', 
                    detail: '개별 물건 공정 진행 중 오류가 발생했습니다.', 
                    life: 3000 
                });
            });
    };

    const fetchOrders = () => {
        fetch(`${API_BASE_URL}/api/orders`, { headers: getAuthHeaders() })
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
                    stage: o.stage || ''
                }));
                setOrders(mappedData);
            })
            .catch((_err) => console.error('Error fetching orders:', _err));
    };

    const formatEventDateTime = (dateStr: any) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            let hours = d.getHours();
            const period = hours < 12 ? '오전' : '오후';
            hours = hours % 12;
            if (hours === 0) hours = 12;
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd} ${period} ${String(hours).padStart(2, '0')}:${min}`;
        } catch {
            return String(dateStr);
        }
    };

    const fetchNotifications = () => {
        fetch(`${API_BASE_URL}/api/notifications`, { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const mapped = data.map((n: any) => ({
                        ...n,
                        time: formatEventDateTime(n.createdAt || new Date())
                    }));
                    _setLiveEvents(mapped);
                }
            })
            .catch(err => console.error('Failed to fetch notifications:', err));
    };

    const handleDismissNotification = (ev: any) => {
        _setLiveEvents(prev => prev.filter(item => item.id !== ev.id));
        if (ev.id) {
            fetch(`${API_BASE_URL}/api/notifications/${ev.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            }).catch(err => console.error('Failed to delete notification:', err));
        }
    };

    const handleNotificationClick = (ev: any) => {
        if (!ev.isRead) {
            fetch(`${API_BASE_URL}/api/notifications/${ev.id}/read`, { method: 'POST', headers: getAuthHeaders() })
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
            brokerURL: getWsBrokerUrl('/ws-alerts-raw'),
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
                            time: formatEventDateTime(payload.createdAt || new Date())
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
        fetch(`${API_BASE_URL}/api/orders/${selectedOrderId}/hold`, { method: 'POST', headers: getAuthHeaders() })
            .then(() => {
                closeModal('changeRequest');
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
                onSelectMenu={handleSelectMenu} 
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
                        <h2 className="m-0 text-xl font-bold text-900 tracking-tight cursor-pointer" onClick={() => handleSelectMenu('dashboard')}>
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
                                openModal('createOrder'); 
                                loadAllProducts(); 
                            }} 
                        />
                        <Button label="협력사 초대" icon="pi pi-users" className="p-button-outlined p-button-info p-button-sm" onClick={openHandshakeModal} />
                        
                        <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                            <div 
                                onClick={() => handleSelectMenu('account')} 
                                className="w-2rem h-2rem border-circle bg-primary flex align-items-center justify-content-center text-white font-bold text-sm cursor-pointer shadow-1"
                                title="계정 및 소셜 연동 관리"
                            >
                                <i className="pi pi-user"></i>
                            </div>
                            <span className="text-700 font-bold text-sm cursor-pointer" onClick={() => handleSelectMenu('account')}>로그인됨</span>
                            <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger ml-2" aria-label="Logout" tooltip="로그아웃" tooltipOptions={{position: 'bottom'}} onClick={() => { localStorage.removeItem('jwtToken'); window.location.href = '/login'; }} />
                        </div>
                    </div>
                </div>

                {/* Main Content Area based on activeMenu */}
                {activeMenu === 'dashboard' && (
                    <div className="flex-1 flex overflow-hidden p-3 gap-3">
                        {/* Left Panel: Metrics & Charts */}
                        <DashboardSidebar 
                            orders={dashboardOrders}
                            todayGold={todayGold}
                            yesterdayGold={yesterdayGold}
                            delta24k={delta24k}
                            goldPriceData={goldPriceData}
                            onOpenGoldTools={() => openModal('goldTools')}
                        />

                        {/* Right Panel: Pipeline & Data Table */}
                        <div className="flex-1 flex flex-column gap-3 overflow-hidden">
                            {/* Pipeline Visualizer */}
                            <PipelineOverview 
                                orders={dashboardOrders}
                                pipelineSteps={pipelineSteps}
                                templates={templates}
                            />

                            {/* Enhanced Data Table */}
                            <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column overflow-hidden">
                                <h4 className="m-0 mb-3 text-600 font-medium">상세 주문 모니터링</h4>
                                <div className="flex-1 overflow-auto custom-dark-table pb-3">
                                    <OrderTable 
                                        orders={dashboardOrders}
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
                            onDismissEvent={(ev) => handleDismissNotification(ev)}
                            pipelineSteps={pipelineSteps}
                        />
                    </div>
                )}

                {activeMenu === 'customer' && <CustomerAdminPage />}
                {activeMenu === 'orders' && (
                    <OrderAdminPage 
                        orders={orders} 
                        templates={templates}
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
                createOrderForm={createOrderForm}
                setCreateOrderForm={setCreateOrderForm}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                filteredProducts={filteredProducts}
                searchProduct={searchProduct}
                handleFileUpload={handleFileUpload}
                submitCreateOrder={submitCreateOrder}
                localImagePreview={localImagePreview}

                submitChangeRequest={submitChangeRequest}

                cancelEstimate={cancelEstimate}
                submitCancelOrder={submitCancelOrder}

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

                subcontracts={subcontracts}
                scForm={scForm}
                setScForm={setScForm}
                receiveForm={receiveForm}
                setReceiveForm={setReceiveForm}
                handleDispatchSubcontract={handleDispatchSubcontract}
                handleReceiveSubcontract={handleReceiveSubcontract}

                selectedOrderId={selectedOrderId}
                orders={orders}
                orderDetailData={orderDetailData}
                pipelineStages={pipelineStages}
                pipelineSteps={pipelineSteps}
                advanceStage={advanceStage}
                advanceWorkOrderStage={advanceWorkOrderStage}
                openSubcontractModal={openSubcontractModal}
                openCancelModal={openCancelModal}
                handlePrint={handlePrint}

                fetchOrders={fetchOrders}
                fetchPipelineStages={fetchPipelineStages}

                goldPriceData={goldPriceData}
                templates={templates}
            />

            {/* Print Views */}
            <PrintView printOrder={printOrder} printMode={printMode} />
        </>
    );
}

export default App;
