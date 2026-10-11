import { getAuthHeaders, API_BASE_URL } from './client';

export async function getRecentMetalPrices() {
    const res = await fetch(`${API_BASE_URL}/api/metal-prices/recent`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch metal prices');
    return res.json();
}
