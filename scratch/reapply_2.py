import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 2. Handshake Verify Headers
content = re.sub(
    r"headers:\s*\{\s*'Content-Type':\s*'application/json'\s*\}",
    "headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }",
    content
)

# 8. stats fetch
content = re.sub(
    r"fetch\('http://localhost:8888/api/orders/stats'\)",
    "fetch('http://localhost:8888/api/orders/stats', { headers: getAuthHeaders() })",
    content
)

# 9. pi-eye
content = re.sub(
    r'<Button icon="pi pi-eye" className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions=\{\{position: \'left\'\}\} />',
    '<Button icon="pi pi-eye" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(rowData.id); setOrderDetailVisible(true); }} className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions={{position: \'left\'}} />',
    content
)

# 3. statusBodyTemplate
status_body_pattern = r"const statusBodyTemplate = \(rowData: any\) => \{.*?\};"
status_replace = """const statusBodyTemplate = (rowData: any) => {
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
content = re.sub(status_body_pattern, status_replace, content, flags=re.DOTALL)

# 4. fetchOrders
fetch_orders_pattern = r"const fetchOrders = \(\) => \{.*?catch\(err => console.error\('Error fetching stats:', err\)\);\n\s*\};"
new_fetch = """const fetchOrders = () => {
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
content = re.sub(fetch_orders_pattern, new_fetch, content, flags=re.DOTALL)

# 5. Pipeline colors
pipeline_colors_pattern = r"const stageColors: Record<string, \{bg: string, border: string, text: string\}> = \{.*?\};"
new_pipeline_colors = """const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                      '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                      'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                      '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                      '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                      '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                  };"""
content = re.sub(pipeline_colors_pattern, new_pipeline_colors, content, flags=re.DOTALL)

# 6 & 7. Header Logout button
header_pattern = r"<Button label=\{t\('lang'\)\} icon=\"pi pi-globe\".*?/>\n\s*<div"
header_replace = """<Button label={t('lang')} icon="pi pi-globe" className="p-button-text p-button-secondary p-button-sm text-700" onClick={toggleLanguage} />
                      <div className="flex align-items-center gap-2 border-left-1 border-300 pl-3 ml-1">
                          <div className="w-2rem h-2rem border-circle bg-primary flex align-items-center justify-content-center text-white font-bold text-sm">
                              <i className="pi pi-user"></i>
                          </div>
                          <span className="text-700 font-bold text-sm">로그인됨</span>
                          <Button icon="pi pi-sign-out" className="p-button-rounded p-button-text p-button-danger ml-2" aria-label="Logout" tooltip="로그아웃" tooltipOptions={{position: 'bottom'}} onClick={handleLogout} />
                      </div>
                      <div"""
content = re.sub(header_pattern, header_replace, content, flags=re.DOTALL)

return_search = r"    return \(\n\s*<div className=\"surface-ground min-h-screen\">"
return_replace = """    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return (
        <>
        <div className="surface-ground min-h-screen no-print">"""
content = re.sub(return_search, return_replace, content)

# 8. Wrap root return in Fragment and separate print divs
end_search = r"\{\/\* Print Views \*\/\}.*?</div>\n\s*\);\n\}"
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
    );
}"""
content = re.sub(end_search, end_replace, content, flags=re.DOTALL)

# 10. Fix layout of subcontract modal inputs
old_layout = r"<div className=\"col-3 flex flex-column gap-2\">"
new_layout = """<div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">"""
content = re.sub(old_layout, new_layout, content)


with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
