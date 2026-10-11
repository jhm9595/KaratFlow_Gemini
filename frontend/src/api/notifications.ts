import { getAuthHeaders, API_BASE_URL } from './client';

export async function getNotifications() {
    const res = await fetch(`${API_BASE_URL}/api/notifications`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
}

export async function markNotificationAsRead(id: number) {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    return res;
}
