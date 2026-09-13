import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add useNavigate
if "import { useNavigate" not in text:
    text = text.replace("import { useState, useEffect, useRef } from 'react';", "import { useState, useEffect, useRef } from 'react';\nimport { useNavigate } from 'react-router-dom';")
if "const navigate = useNavigate();" not in text:
    text = text.replace("const [orders, setOrders] = useState<any[]>([]);", "const navigate = useNavigate();\n    const [orders, setOrders] = useState<any[]>([]);")

# 2. Add 401 Intercepts to fetchOrders
fetch_orders_original = """    const fetchOrders = () => {
        fetch('http://localhost:8888/api/orders', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch((_err) => console.error('Error fetching orders:', _err));
            
        fetch('http://localhost:8888/api/orders/stats', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setDashboardStats(data))
            .catch((_err) => console.error('Error fetching stats:', _err));
    };"""

fetch_orders_fixed = """    const fetchOrders = () => {
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
                const mappedData = data.map((o: any) => {
                    let s = o.stage;
                    if (s) s = s.toUpperCase();
                    if (s === 'PENDING') s = '접수';
                    else if (s === 'CAD') s = 'CAD';
                    else if (s === 'CASTING' || s === '주물') s = '주물';
                    else if (s === 'POLISHING' || s === '세공') s = '세공';
                    else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '완성';
                    return { ...o, stage: s };
                });
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
    };"""

text = text.replace(fetch_orders_original, fetch_orders_fixed)

# 3. Add Live Events
if "const [liveEvents, setLiveEvents]" not in text:
    text = text.replace("const [_dashboardStats, setDashboardStats] = useState", "const [liveEvents, setLiveEvents] = useState<{id: number, message: string, time: string}[]>([]);\n    const [_dashboardStats, setDashboardStats] = useState")

# 4. Add Live Events push in the websocket
ws_original = """                        toast.current?.show({ 
                            severity: 'error', 
                            detail: payload.message || t('alert_desc'), 
                            life: 5000 
                        });
                        fetchOrders();"""
ws_fixed = """                        toast.current?.show({ 
                            severity: 'info', 
                            summary: 'Live Event',
                            detail: payload.message, 
                            life: 5000 
                        });
                        setLiveEvents(prev => [{
                            id: Date.now(),
                            message: payload.message,
                            time: new Date().toLocaleTimeString()
                        }, ...prev].slice(0, 50));
                        fetchOrders();"""
text = text.replace(ws_original, ws_fixed)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Remaining logic restored.")
