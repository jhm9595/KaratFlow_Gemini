import { getAuthHeaders } from './client';

export async function getProducts() {
    const res = await fetch('http://localhost:8888/api/products', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}
