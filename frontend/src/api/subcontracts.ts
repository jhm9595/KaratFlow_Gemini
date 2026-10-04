import { getAuthHeaders } from './client';

export async function getSubcontracts(orderId: number) {
    const res = await fetch(`http://localhost:8888/api/orders/${orderId}/subcontracts`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch subcontracts');
    return res.json();
}

export async function createSubcontract(payload: any) {
    const res = await fetch('http://localhost:8888/api/subcontracts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function receiveSubcontract(subcontractId: number, receivedWeightG: number) {
    const res = await fetch(`http://localhost:8888/api/subcontracts/${subcontractId}/receive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ receivedWeightG }),
    });
    return res.json();
}
