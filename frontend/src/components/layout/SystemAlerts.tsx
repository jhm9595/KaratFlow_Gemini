import React, { useState, useEffect } from 'react';
import { Message } from 'primereact/message';

const SystemAlerts: React.FC = () => {
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const token = localStorage.getItem('jwt_token');
                const response = await fetch('http://localhost:8888/api/system/health/alerts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAlerts(data);
                }
            } catch (e) {
                console.error('Failed to fetch system alerts', e);
            }
        };
        fetchAlerts();
    }, []);

    if (alerts.length === 0) return null;

    return (
        <>
            {alerts.map((alert, index) => (
                <div key={index} className="px-4 pt-3 pb-0 no-print">
                    <Message severity={alert.severity} text={`${alert.summary} - ${alert.detail}`} style={{ width: '100%', justifyContent: 'flex-start' }} />
                </div>
            ))}
        </>
    );
};

export default SystemAlerts;
