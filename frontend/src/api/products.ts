import { getAuthHeaders, API_BASE_URL } from './client';

export async function getProducts() {
    const res = await fetch(`${API_BASE_URL}/api/products`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}
