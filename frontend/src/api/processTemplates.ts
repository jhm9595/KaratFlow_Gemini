import { getAuthHeaders, API_BASE_URL } from './client';

export async function getProcessTemplates() {
    const res = await fetch(`${API_BASE_URL}/api/process-templates`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch process templates');
    return res.json();
}
