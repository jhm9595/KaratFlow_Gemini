package com.minibig.karatflow.backend.domain;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class OrderDetailDTO {
    private Long orderId;
    private String orderNo;
    private String brand;
    private String designCode;
    private String productName;
    private String imageUrl;
    private Integer quantity;
    
    private List<WorkOrderDTO> workOrders;
    
    @Data
    @Builder
    public static class WorkOrderDTO {
        private Long id;
        private String stage;
        private Boolean isHold;
        private String createdAt;
    }
}
