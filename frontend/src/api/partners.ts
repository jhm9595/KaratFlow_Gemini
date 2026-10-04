import { getAuthHeaders } from './client';

export async function getHandshakes() {
    const res = await fetch('http://localhost:8888/api/handshake', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch handshakes');
    return res.json();
}

export async function requestHandshakePin() {
    const res = await fetch('http://localhost:8888/api/handshake/request', {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to request pin');
    return res.json();
}

export async function verifyHandshakePin(pinCode: string) {
    const res = await fetch('http://localhost:8888/api/handshake/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pinCode }),
    });
    return res;
}

export async function verifyBusinessNumber(businessNumber: string) {
    const res = await fetch('http://localhost:8888/api/business/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ businessNumber }),
    });
    return res.json();
}
