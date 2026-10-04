import { getAuthHeaders } from './client';

export async function getRecentMetalPrices() {
    const res = await fetch('http://localhost:8888/api/metal-prices/recent', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch metal prices');
    return res.json();
}
