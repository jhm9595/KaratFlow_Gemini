export const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('jwtToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};
