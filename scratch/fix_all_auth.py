import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. handshake/request
text = text.replace("fetch('http://localhost:8888/api/handshake/request', { method: 'POST' })", "fetch('http://localhost:8888/api/handshake/request', { method: 'POST', headers: getAuthHeaders() })")

# 2. handshake/verify
text = text.replace("headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify({ pinCode: handshakePin })", "headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },\n            body: JSON.stringify({ pinCode: handshakePin })")

# 3. subcontracts
text = text.replace("fetch(`http://localhost:8888/api/orders/${orderId}/subcontracts`)", "fetch(`http://localhost:8888/api/orders/${orderId}/subcontracts`, { headers: getAuthHeaders() })")

# 4. subcontracts/dispatch
text = text.replace("fetch(`http://localhost:8888/api/orders/${selectedOrderId}/subcontracts/dispatch`, {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json' }", "fetch(`http://localhost:8888/api/orders/${selectedOrderId}/subcontracts/dispatch`, {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }")

# 5. subcontracts/receive
text = text.replace("fetch(`http://localhost:8888/api/orders/${selectedOrderId}/subcontracts/${taskId}/receive`, {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json' }", "fetch(`http://localhost:8888/api/orders/${selectedOrderId}/subcontracts/${taskId}/receive`, {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }")

# 6. cancel-estimate
text = text.replace("fetch(`http://localhost:8888/api/orders/${orderId}/cancel-estimate`)", "fetch(`http://localhost:8888/api/orders/${orderId}/cancel-estimate`, { headers: getAuthHeaders() })")

# 7. cancel
text = text.replace("fetch(`http://localhost:8888/api/orders/${selectedOrderId}/cancel`, { method: 'POST' })", "fetch(`http://localhost:8888/api/orders/${selectedOrderId}/cancel`, { method: 'POST', headers: getAuthHeaders() })")

# 8. advance-stage
text = text.replace("fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST' })", "fetch(`http://localhost:8888/api/orders/${orderId}/advance-stage`, { method: 'POST', headers: getAuthHeaders() })")

# 9. hold
text = text.replace("fetch(`http://localhost:8888/api/orders/${selectedOrderId}/hold`, { method: 'POST' })", "fetch(`http://localhost:8888/api/orders/${selectedOrderId}/hold`, { method: 'POST', headers: getAuthHeaders() })")

# 10. invoice
text = text.replace("await fetch(`http://localhost:8888/api/orders/${order.id}/invoice`);", "await fetch(`http://localhost:8888/api/orders/${order.id}/invoice`, { headers: getAuthHeaders() });")

# Also create new order POST
text = text.replace("fetch('http://localhost:8888/api/orders', {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json' }", "fetch('http://localhost:8888/api/orders', {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("All API auth headers added!")
