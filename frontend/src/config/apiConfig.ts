/**
 * Global API & Server Configuration
 * Environment variables configured via Vite (VITE_API_BASE_URL, VITE_WS_URL).
 * Defaults to local development servers if not specified.
 */

// Base URL for Backend REST API (e.g., http://localhost:8888 or https://api.yourdomain.com)
export const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8888'
).replace(/\/$/, ''); // Remove trailing slash if present

// Base URL for WebSocket Alerts (e.g., ws://localhost:8888 or wss://api.yourdomain.com)
export const getWsBrokerUrl = (endpoint: string = '/ws-alerts-raw'): string => {
    if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
    }
    
    // Auto-derive ws:// or wss:// from API_BASE_URL
    let wsProto = 'ws://';
    let cleanBase = API_BASE_URL;

    if (API_BASE_URL.startsWith('https://')) {
        wsProto = 'wss://';
        cleanBase = API_BASE_URL.replace(/^https:\/\//, '');
    } else if (API_BASE_URL.startsWith('http://')) {
        wsProto = 'ws://';
        cleanBase = API_BASE_URL.replace(/^http:\/\//, '');
    }

    return `${wsProto}${cleanBase}${endpoint}`;
};
