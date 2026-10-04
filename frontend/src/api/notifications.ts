import { getAuthHeaders } from './client';

export async function getNotifications() {
    const res = await fetch('http://localhost:8888/api/notifications', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
}

export async function markNotificationAsRead(id: number) {
    const res = await fetch(`http://localhost:8888/api/notifications/${id}/read`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    return res;
}
