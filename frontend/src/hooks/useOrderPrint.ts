import { useState } from 'react';
import { API_BASE_URL } from '../config/apiConfig';

export function useOrderPrint(getAuthHeaders: () => Record<string, string>) {
    const [printOrder, setPrintOrder] = useState<any>(null);
    const [printMode, setPrintMode] = useState<'label' | 'invoice' | null>(null);

    const handlePrint = async (order: any, mode: 'label' | 'invoice') => {
        if (!order) return;
        let mergedOrder = { ...order };

        try {
            const detailRes = await fetch(`${API_BASE_URL}/api/orders/${order.id}/details`, { headers: getAuthHeaders() });
            if (detailRes.ok) {
                const detailData = await detailRes.json();
                mergedOrder = { ...mergedOrder, ...detailData };
            }
        } catch (err) {
            console.error('Failed to fetch details for print:', err);
        }

        if (mode === 'invoice') {
            try {
                const res = await fetch(`${API_BASE_URL}/api/orders/${order.id}/invoice`, { headers: getAuthHeaders() });
                if (res.ok) {
                    const invoiceData = await res.json();
                    mergedOrder.invoice = invoiceData;
                }
            } catch (err) {
                console.error('Failed to fetch invoice data:', err);
            }
        }

        setPrintOrder(mergedOrder);
        setPrintMode(mode);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    return {
        printOrder,
        printMode,
        handlePrint,
    };
}
