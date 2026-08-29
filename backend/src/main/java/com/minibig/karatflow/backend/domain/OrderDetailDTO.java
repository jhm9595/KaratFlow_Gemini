package com.minibig.karatflow.backend.domain;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class OrderDetailDTO {
    private Long orderId;
    private String orderNo;
    private String customerName;
    private String customerPhone;
    private String orderType;
    private String orderDate;
    private String brand;
    private String designCode;
    private String productName;
    private String imageUrl;
    private Integer quantity;
    private String engravingText;
    private String engravingLocation;
    private String surfaceFinish;

    private List<WorkOrderDTO> workOrders;

    @Data
    @Builder
    public static class WorkOrderDTO {
        private Long id;
        private String workOrderNo;
        private String stage;
        private Boolean isHold;
        private String createdAt;
    }
}
