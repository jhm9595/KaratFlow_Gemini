package com.minibig.karatflow.backend.domain;

/**
 * Standard Order Status definitions and lifecycle evaluation helpers.
 * Note: These methods evaluate the lifecycle status of an Order entity.
 * For WorkOrder stage completion, evaluation should be based on reaching the last step
 * of the associated process template (see OrderService.isWorkOrderCompleted).
 */
public enum OrderStatus {
    PROCESSING,
    COMPLETED,
    CANCELLED;

    public static boolean isCompleted(String status) {
        if (status == null) return false;
        String clean = status.trim();
        return COMPLETED.name().equalsIgnoreCase(clean)
                || "DONE".equalsIgnoreCase(clean)
                || "완료".equalsIgnoreCase(clean)
                || "완성".equalsIgnoreCase(clean);
    }

    public static boolean isCancelled(String status) {
        if (status == null) return false;
        String clean = status.trim();
        return CANCELLED.name().equalsIgnoreCase(clean)
                || "취소".equalsIgnoreCase(clean);
    }

    public static boolean isTerminal(String status) {
        return isCompleted(status) || isCancelled(status);
    }

    public static OrderStatus fromString(String status) {
        if (status == null) return PROCESSING;
        String clean = status.trim();
        if (isCompleted(clean)) return COMPLETED;
        if (isCancelled(clean)) return CANCELLED;
        return PROCESSING;
    }

    public static String normalize(String status) {
        return fromString(status).name();
    }
}

