import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. getAuthHeaders() to mutating fetch calls
# We'll just replace all fetch( URL, { method: 'POST/PUT', headers: ... } )
# Actually it's easier to just do it manually for the specific ones:
content = content.replace(
    "fetch('http://localhost:8888/api/handshake', {",
    "fetch('http://localhost:8888/api/handshake', { headers: getAuthHeaders(), "
)
content = content.replace(
    "fetch('http://localhost:8888/api/handshake/request', { method: 'POST' })",
    "fetch('http://localhost:8888/api/handshake/request', { method: 'POST', headers: getAuthHeaders() })"
)
content = content.replace(
    "            method: 'POST',\n            headers: {\n                'Content-Type': 'application/json'\n            }",
    "            method: 'POST',\n            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }"
)
content = content.replace(
    "fetch(`http://localhost:8888/api/orders/${orderId}/subcontracts`)",
    "fetch(`http://localhost:8888/api/orders/${orderId}/subcontracts`, { headers: getAuthHeaders() })"
)
content = content.replace(
    "            method: 'PUT',\n            headers: { 'Content-Type': 'application/json' }",
    "            method: 'PUT',\n            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }"
)
content = content.replace(
    "fetch(`http://localhost:8888/api/orders/${orderId}/cancel-estimate`)",
    "fetch(`http://localhost:8888/api/orders/${orderId}/cancel-estimate`, { headers: getAuthHeaders() })"
)
content = content.replace(
    "fetch(`http://localhost:8888/api/orders/${selectedOrderId}/cancel`, { method: 'POST' })",
    "fetch(`http://localhost:8888/api/orders/${selectedOrderId}/cancel`, { method: 'POST', headers: getAuthHeaders() })"
)
content = content.replace(
    "fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST' })",
    "fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST', headers: getAuthHeaders() })"
)
content = content.replace(
    "fetch('http://localhost:8888/api/orders/stats')",
    "fetch('http://localhost:8888/api/orders/stats', { headers: getAuthHeaders() })"
)

# 2. Add Tag component import
content = content.replace(
    "import { Card } from 'primereact/card';",
    "import { Card } from 'primereact/card';\nimport { Tag } from 'primereact/tag';"
)

# 3. Replace custom spans in statusBodyTemplate with PrimeReact Tag
status_body = """    const statusBodyTemplate = (rowData: any) => {
        let s = rowData.stage;
        if (!s) s = rowData.status === 'COMPLETED' ? '완성' : '접수';
        if (s === 'PENDING') s = '접수';
        else if (s === 'CAD') s = 'CAD';
        else if (s === 'CASTING' || s === '주물') s = '주물';
        else if (s === 'POLISHING' || s === '세공') s = '세공';
        else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';

        const stageMap: Record<string, { color: string, label: string }> = {
            '접수': { color: 'bg-indigo-100 text-indigo-700 border-indigo-500', label: '접수' },
            'CAD': { color: 'bg-blue-100 text-blue-700 border-blue-500', label: 'CAD' },
            '주물': { color: 'bg-orange-100 text-orange-700 border-orange-500', label: '주물' },
            '세공': { color: 'bg-yellow-100 text-yellow-700 border-yellow-500', label: '세공' },
            '완성': { color: 'bg-green-100 text-green-700 border-green-500', label: '완성' }
        };

        const mapped = stageMap[s] || { color: 'bg-gray-100 text-gray-700 border-gray-500', label: s };

        return (
            <span className={`px-3 py-1 border-round-xl font-bold text-sm ${mapped.color}`}>
                {mapped.label}
            </span>
        );
    };"""

status_replace = """    const statusBodyTemplate = (rowData: any) => {
        let s = rowData.stage;
        if (!s) s = rowData.status === 'COMPLETED' ? '완성' : '접수';
        if (s === 'PENDING') s = '접수';
        else if (s === 'CAD') s = 'CAD';
        else if (s === 'CASTING' || s === '주물') s = '주물';
        else if (s === 'POLISHING' || s === '세공') s = '세공';
        else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';

        const stageMap: Record<string, { label: string, severity: 'success' | 'info' | 'warning' | 'danger' | null }> = {
            '접수': { label: '접수', severity: null }, // gray
            'CAD': { label: 'CAD', severity: 'info' }, // blue
            '주물': { label: '주물', severity: 'warning' }, // orange
            '세공': { label: '세공', severity: 'danger' }, // pink/red
            '완성': { label: '완성', severity: 'success' }, // green
        };

        const mapped = stageMap[s] || { label: s, severity: null };

        return (
            <Tag severity={mapped.severity} value={mapped.label} rounded></Tag>
        );
    };"""
content = content.replace(status_body, status_replace)

# 4. Fix fetchOrders mapping to Korean and HTML redirect logic
old_fetch = """    const fetchOrders = () => {
        fetch('http://localhost:8888/api/orders')
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error('Error fetching orders:', err));
            
        fetch('http://localhost:8888/api/orders/stats')
            .then(res => res.json())
            .then(data => setDashboardStats(data))
            .catch(err => console.error('Error fetching stats:', err));
    };"""

new_fetch = """    const fetchOrders = () => {
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
                    if (s === 'PENDING') s = '접수';
                    else if (s === 'CAD') s = 'CAD';
                    else if (s === 'CASTING' || s === '주물') s = '주물';
                    else if (s === 'POLISHING' || s === '세공') s = '세공';
                    else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '완성';
                    else s = '접수';
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
    };"""
content = content.replace(old_fetch, new_fetch)

# 5. Pipeline colors
old_pipeline_colors = """                                const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                    '접수': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
                                    'CAD': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
                                    '주물': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
                                    '세공': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
                                    '완성': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' }
                                };"""
new_pipeline_colors = """                                const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                    '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                    'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                    '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                    '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                    '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                };"""
content = content.replace(old_pipeline_colors, new_pipeline_colors)

# 6. Logout button in header
header_search = """<Button label={t('lang')} icon="pi pi-globe" className="p-button-text p-button-secondary p-button-sm text-700" onClick={toggleLanguage} />"""
header_replace = """<Button label={t('lang')} icon="pi pi-globe" className="p-button-text p-button-secondary p-button-sm text-700" onClick={toggleLanguage} />
                    <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                        <div className="w-2rem h-2rem border-circle bg-primary flex align-items-center justify-content-center text-white font-bold text-sm">
                            <i className="pi pi-user"></i>
                        </div>
                        <span className="text-700 font-bold text-sm">로그인됨</span>
                        <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger ml-2" aria-label="Logout" tooltip="로그아웃" tooltipOptions={{position: 'bottom'}} onClick={handleLogout} />
                    </div>"""
content = content.replace(header_search, header_replace)

# 7. Add handleLogout function before the final return
return_search = """    return (
        <div className="surface-ground min-h-screen">"""
return_replace = """    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return (
        <>
        <div className="surface-ground min-h-screen no-print">"""
content = content.replace(return_search, return_replace)

# 8. Wrap root return in Fragment and separate print divs (the original had print-mode inside no-print)
end_search = """            {/* Print Views */}
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
                    <h1>주문 명세서</h1>
                    <div className="invoice-details">
                        <p><strong>주문 번호:</strong> {printOrder.orderNo || printOrder.id}</p>
                        <p><strong>고객명:</strong> {printOrder.customerName}</p>
                        <p><strong>디자인:</strong> {printOrder.design}</p>
                        <p><strong>결제 예상 금액:</strong> ₩{printOrder.invoice?.estimatedPrice?.toLocaleString() || '-'}</p>
                    </div>
                </div>
            )}
        </div>
    );"""
end_replace = """        </div>
        {/* Print Views (Outside of no-print container) */}
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
                    <h1>주문 명세서</h1>
                    <div className="invoice-details">
                        <p><strong>주문 번호:</strong> {printOrder.orderNo || printOrder.id}</p>
                        <p><strong>고객명:</strong> {printOrder.customerName}</p>
                        <p><strong>디자인:</strong> {printOrder.design}</p>
                        <p><strong>결제 예상 금액:</strong> ₩{printOrder.invoice?.estimatedPrice?.toLocaleString() || '-'}</p>
                    </div>
                </div>
            )}
        </>
    );"""
content = content.replace(end_search, end_replace)

# 9. Add onClick to pi-eye
content = content.replace(
    """<Button icon="pi pi-eye" className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions={{position: 'left'}} />""",
    """<Button icon="pi pi-eye" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(rowData.id); setOrderDetailVisible(true); }} className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions={{position: 'left'}} />"""
)

# 10. Fix layout of subcontract modal inputs
old_layout = """                                <div className="col-3 flex flex-column gap-2">
                                    <label>작업명 (예: 도금)</label>
                                    <InputText className="w-full" value={scForm.taskName} onChange={(e) => setScForm({...scForm, taskName: e.target.value})} />
                                </div>
                                <div className="col-3 flex flex-column gap-2">
                                    <label>외주업체명</label>
                                    <InputText className="w-full" value={scForm.subcontractorName} onChange={(e) => setScForm({...scForm, subcontractorName: e.target.value})} />
                                </div>
                                <div className="col-3 flex flex-column gap-2">
                                    <label>반출 실측 중량 (g)</label>
                                    <InputNumber className="w-full" value={scForm.dispatchedWeightG} onValueChange={(e) => setScForm({...scForm, dispatchedWeightG: e.value || 0})} mode="decimal" minFractionDigits={2} />
                                </div>
                                <div className="col-3 flex flex-column gap-2">
                                    <label>협의 외주공임 (₩)</label>
                                    <InputNumber className="w-full" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
                                </div>"""
new_layout = """                                <div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
                                    <label>작업명 (예: 도금)</label>
                                    <InputText className="w-full" value={scForm.taskName} onChange={(e) => setScForm({...scForm, taskName: e.target.value})} />
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
                                    <label>협의 외주공임 (₩)</label>
                                    <InputNumber className="w-full" value={scForm.agreedLaborFee} onValueChange={(e) => setScForm({...scForm, agreedLaborFee: e.value || 0})} />
                                </div>"""
content = content.replace(old_layout, new_layout)


with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Re-applied all fixes with CORRECT UTF-8 ENCODING.")
