import { getAuthHeaders, API_BASE_URL } from './client';

export async function getHandshakes() {
    const res = await fetch(`${API_BASE_URL}/api/handshake`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch handshakes');
    return res.json();
}

export async function requestHandshakePin() {
    const res = await fetch(`${API_BASE_URL}/api/handshake/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to request pin');
    return res.json();
}

export async function verifyHandshakePin(pinCode: string) {
    const res = await fetch(`${API_BASE_URL}/api/handshake/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pinCode }),
    });
    return res;
}

export async function verifyBusinessNumber(businessNumber: string) {
    const res = await fetch(`${API_BASE_URL}/api/business/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ businessNumber }),
    });
    return res.json();
}
