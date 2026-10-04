import { getAuthHeaders } from './client';

const BASE_URL = 'http://localhost:8888/api/orders';

export async function getOrders() {
    const res = await fetch(BASE_URL, { headers: getAuthHeaders() });
    if (res.status === 401 || res.redirected || (res.url && res.url.includes('/login'))) {
        throw new Error('UNAUTHORIZED');
    }
    return res.json();
}

export async function getOrderStats() {
    const res = await fetch(`${BASE_URL}/stats`, { headers: getAuthHeaders() });
    if (res.status === 401 || res.redirected || (res.url && res.url.includes('/login'))) {
        throw new Error('UNAUTHORIZED');
    }
    return res.json();
}

export async function getOrderDetail(orderId: number) {
    const res = await fetch(`${BASE_URL}/${orderId}/details`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch order detail');
    return res.json();
}

export async function getOrderInvoice(orderId: number) {
    const res = await fetch(`${BASE_URL}/${orderId}/invoice`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch invoice');
    return res.json();
}

export async function createOrder(payload: any) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function advanceOrderStage(orderId: number) {
    const res = await fetch(`${BASE_URL}/${orderId}/advance-stage`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    return res.json();
}

export async function getCancelEstimate(orderId: number) {
    const res = await fetch(`${BASE_URL}/${orderId}/cancel-estimate`, { headers: getAuthHeaders() });
    return res.json();
}

export async function cancelOrder(orderId: number) {
    const res = await fetch(`${BASE_URL}/${orderId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    return res.json();
}

export async function setOrderHold(orderId: number) {
    const res = await fetch(`${BASE_URL}/${orderId}/hold`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    return res;
}
