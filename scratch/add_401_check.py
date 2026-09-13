import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
    const fetchOrders = () => {
        fetch('http://localhost:8888/api/orders', { headers: getAuthHeaders() })
            .then(res => {
                if (res.status === 401) {
                    localStorage.removeItem('jwtToken');
                    navigate('/login');
                    throw new Error('Unauthorized');
                }
                return res.json();
            })
"""

content = content.replace("""
    const fetchOrders = () => {
        fetch('http://localhost:8888/api/orders', { headers: getAuthHeaders() })
            .then(res => res.json())
""", replacement[1:])

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added 401 check to fetchOrders")
