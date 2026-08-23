package com.minibig.karatflow.backend.dto;
import lombok.Builder;
import lombok.Data;
@Data
@Builder
public class OrderResponseDTO {
    private Long id;
    private String orderNo;
    private String shortCode;
    private String design;
    private String date;
    private String stage;
    private Boolean isHold;
    private String engravingText;
    private String engravingLocation;
    private String surfaceFinish;
    private String orderType;
    private String customerName;
    private String customerPhone;
    private Double finalConsumerPrice;
        private String status;
    private Double cancellationFee;
    
    private String createdAt;
    private String pendingCompletedAt;
    private String cadCompletedAt;
    private String castingCompletedAt;
    private String polishingCompletedAt;
    private String platingCompletedAt;
    private String completedAt;
}
