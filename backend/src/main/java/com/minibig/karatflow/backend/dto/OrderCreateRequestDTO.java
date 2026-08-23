package com.minibig.karatflow.backend.dto;

import lombok.Data;

@Data
public class OrderCreateRequestDTO {
    private String orderType; // B2B or B2C
    private String customerName;
    private String customerPhone;
    private Long designId;
    private String unmappedProductName;
    private String unmappedBrandName;
    private String imageUrl;
    private Integer quantity;
    private String engravingText;
    private String engravingLocation;
    private String surfaceFinish;
    private Double finalConsumerPrice;
}
