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
 */
export function isOrderCancelled(order: any): boolean {
    return order?.status === ORDER_STATUS.CANCELLED;
}

/**
 * Checks whether an order is completed.
 */
export function isOrderCompleted(order: any, _lastStageName?: string): boolean {
    return order?.status === ORDER_STATUS.COMPLETED;
}

/**
 * Checks whether an order is active / in production (not cancelled and not completed).
 */
export function isOrderProcessing(order: any, _lastStageName?: string): boolean {
    return order?.status === ORDER_STATUS.PROCESSING;
}

/**
 * Resolves normalized order status key.
 */
export function getNormalizedOrderStatus(order: any, _lastStageName?: string): OrderStatusType {
    if (isOrderCancelled(order)) return ORDER_STATUS.CANCELLED;
    if (isOrderCompleted(order)) return ORDER_STATUS.COMPLETED;
    return ORDER_STATUS.PROCESSING;
}

