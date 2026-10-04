import { getAuthHeaders } from './client';

export async function getProcessTemplates() {
    const res = await fetch('http://localhost:8888/api/process-templates', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch process templates');
    return res.json();
}
