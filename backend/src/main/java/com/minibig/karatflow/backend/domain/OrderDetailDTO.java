package com.minibig.karatflow.backend.domain;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class OrderDetailDTO {
    private Long orderId;
    private String orderNo;
    private Long templateId;
    private String templateName;
    private List<ProcessTemplateStep> templateSteps;
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
    private List<TimelineEventDTO> timelineEvents;

    @Data
    @Builder
    public static class TimelineEventDTO {
        private String stage;
        private String date;
        private String icon;
        private String color;
        private String elapsed;
    }

    @Data
    @Builder
    public static class WorkOrderDTO {
        private Long id;
        private String workOrderNo;
        private Long templateId;
        private String templateName;
        private String stage;
        private Boolean isHold;
        private String createdAt;
    }
}
