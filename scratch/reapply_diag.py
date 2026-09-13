import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # 1. getAuthHeaders() to mutating fetch calls
    ("fetch('http://localhost:8888/api/handshake', {", "fetch('http://localhost:8888/api/handshake', { headers: getAuthHeaders(), "),
    ("fetch('http://localhost:8888/api/handshake/request', { method: 'POST' })", "fetch('http://localhost:8888/api/handshake/request', { method: 'POST', headers: getAuthHeaders() })"),
    ("            method: 'POST',\n            headers: {\n                'Content-Type': 'application/json'\n            }", "            method: 'POST',\n            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }"),
    ("fetch(`http://localhost:8888/api/orders/${orderId}/subcontracts`)", "fetch(`http://localhost:8888/api/orders/${orderId}/subcontracts`, { headers: getAuthHeaders() })"),
    ("            method: 'PUT',\n            headers: { 'Content-Type': 'application/json' }", "            method: 'PUT',\n            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }"),
    ("fetch(`http://localhost:8888/api/orders/${orderId}/cancel-estimate`)", "fetch(`http://localhost:8888/api/orders/${orderId}/cancel-estimate`, { headers: getAuthHeaders() })"),
    ("fetch(`http://localhost:8888/api/orders/${selectedOrderId}/cancel`, { method: 'POST' })", "fetch(`http://localhost:8888/api/orders/${selectedOrderId}/cancel`, { method: 'POST', headers: getAuthHeaders() })"),
    ("fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST' })", "fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST', headers: getAuthHeaders() })"),
    ("fetch('http://localhost:8888/api/orders/stats')", "fetch('http://localhost:8888/api/orders/stats', { headers: getAuthHeaders() })"),
]

for i, (search, replace) in enumerate(replacements):
    if search in content:
        content = content.replace(search, replace)
        print(f"Replacement 1.{i} SUCCESS")
    else:
        print(f"Replacement 1.{i} FAILED: not found")

# 2. Add Tag component import
search = "import { Card } from 'primereact/card';"
replace = "import { Card } from 'primereact/card';\nimport { Tag } from 'primereact/tag';"
if search in content:
    content = content.replace(search, replace)
    print("Replacement 2 SUCCESS")
else:
    print("Replacement 2 FAILED")

# 3. statusBodyTemplate
status_body_pattern = r"const statusBodyTemplate = \(rowData: any\) => \{.*?\};\n"
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
    };\n"""
new_content, count = re.subn(status_body_pattern, status_replace, content, flags=re.DOTALL)
if count > 0:
    content = new_content
    print("Replacement 3 SUCCESS")
else:
    print("Replacement 3 FAILED")

# 4. fetchOrders
fetch_orders_pattern = r"const fetchOrders = \(\) => \{.*?\};\n\n    useEffect\(\(\) => \{"
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
    };

    useEffect(() => {"""
new_content, count = re.subn(fetch_orders_pattern, new_fetch, content, flags=re.DOTALL)
if count > 0:
    content = new_content
    print("Replacement 4 SUCCESS")
else:
    print("Replacement 4 FAILED")

# 5. Pipeline colors
pipeline_colors_pattern = r"const stageColors: Record<string, \{bg: string, border: string, text: string\}> = \{.*?\};"
new_pipeline_colors = """const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                      '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                      'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                      '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                      '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                      '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                  };"""
new_content, count = re.subn(pipeline_colors_pattern, new_pipeline_colors, content, flags=re.DOTALL)
if count > 0:
    content = new_content
    print("Replacement 5 SUCCESS")
else:
    print("Replacement 5 FAILED")

# 6. Header Logout button
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
new_content, count = re.subn(header_pattern, header_replace, content, flags=re.DOTALL)
if count > 0:
    content = new_content
    print("Replacement 6 SUCCESS")
else:
    print("Replacement 6 FAILED")

# 7. Add handleLogout function before the final return
return_search = r"    return \(\n\s*<div className=\"surface-ground min-h-screen\">"
return_replace = """    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        navigate('/login');
    };

    return (
        <>
        <div className="surface-ground min-h-screen no-print">"""
new_content, count = re.subn(return_search, return_replace, content)
if count > 0:
    content = new_content
    print("Replacement 7 SUCCESS")
else:
    print("Replacement 7 FAILED")

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
new_content, count = re.subn(end_search, end_replace, content, flags=re.DOTALL)
if count > 0:
    content = new_content
    print("Replacement 8 SUCCESS")
else:
    print("Replacement 8 FAILED")

# 9. Add onClick to pi-eye
pi_eye = """<Button icon="pi pi-eye" className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions={{position: 'left'}} />"""
if pi_eye in content:
    content = content.replace(pi_eye, """<Button icon="pi pi-eye" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(rowData.id); setOrderDetailVisible(true); }} className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions={{position: 'left'}} />""")
    print("Replacement 9 SUCCESS")
else:
    print("Replacement 9 FAILED")

# 10. Fix layout of subcontract modal inputs
old_layout = r"<div className=\"col-3\">"
new_layout = """<div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">"""
new_content, count = re.subn(old_layout, new_layout, content)
if count > 0:
    content = new_content
    print("Replacement 10 SUCCESS")
else:
    print("Replacement 10 FAILED")


with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
