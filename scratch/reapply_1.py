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
    
    # 2. Add Tag component import
    ("import { Card } from 'primereact/card';", "import { Card } from 'primereact/card';\nimport { Tag } from 'primereact/tag';"),
    
    # 9. Add onClick to pi-eye
    (
        """<Button icon="pi pi-eye" className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions={{position: 'left'}} />""",
        """<Button icon="pi pi-eye" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(rowData.id); setOrderDetailVisible(true); }} className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" tooltip="상세보기" tooltipOptions={{position: 'left'}} />"""
    ),
]

for i, (search, replace) in enumerate(replacements):
    if search in content:
        content = content.replace(search, replace)
        print(f"Replacement {i} SUCCESS")
    else:
        print(f"Replacement {i} FAILED: not found")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
