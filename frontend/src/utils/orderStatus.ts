/**
 * Standard Order Status definitions and lifecycle evaluation helpers.
 * Matches backend com.minibig.karatflow.backend.domain.OrderStatus.java
 */

export const ORDER_STATUS = {
    ALL: 'ALL',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
} as const;

export type OrderStatusType = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

/**
 * Checks whether an order is cancelled.
 * Evaluates both order.status and order.stage.
 */
export function isOrderCancelled(order: any): boolean {
    if (!order) return false;
    const status = (order.status || '').toString().trim().toUpperCase();
    const stage = (order.stage || '').toString().trim().toUpperCase();
    return status === 'CANCELLED' || status === '취소' ||
           stage === 'CANCELLED' || stage === '취소';
}

/**
 * Checks whether an order is completed.
 * Evaluates explicit completed status, completed stage name, or matching template last step.
 */
export function isOrderCompleted(order: any, lastStageName?: string): boolean {
    if (!order) return false;
    if (isOrderCancelled(order)) return false;

    const status = (order.status || '').toString().trim().toUpperCase();
    const stage = (order.stage || '').toString().trim();

    // 1. Explicit status is completed
    if (status === 'COMPLETED' || status === 'DONE' || status === '완료' || status === '완성') {
        return true;
    }

    // 2. Stage is completed
    if (stage === 'COMPLETED' || stage === 'DONE' || stage === '완료' || stage === '완성') {
        return true;
    }

    // 3. Stage matches template last step
    if (lastStageName && stage && stage.trim().toLowerCase() === lastStageName.trim().toLowerCase()) {
        return true;
    }

    return false;
}

/**
 * Checks whether an order is active / in production (not cancelled and not completed).
 */
export function isOrderProcessing(order: any, lastStageName?: string): boolean {
    if (!order) return false;
    return !isOrderCancelled(order) && !isOrderCompleted(order, lastStageName);
}

/**
 * Resolves normalized order status key.
 */
export function getNormalizedOrderStatus(order: any, lastStageName?: string): OrderStatusType {
    if (isOrderCancelled(order)) return ORDER_STATUS.CANCELLED;
    if (isOrderCompleted(order, lastStageName)) return ORDER_STATUS.COMPLETED;
    return ORDER_STATUS.PROCESSING;
}
