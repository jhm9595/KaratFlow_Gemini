package com.minibig.karatflow.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class InvoiceResponseDTO {
    private Long orderId;
    private String orderType;
    private Double completedWeightG;
    private Double stoneWeightG;
    private Double pureGoldWeightG;
    private Double lossRatePercent;
    private Double settlementBaseWeightG;
    private LocalDate priceDate;
    private Double goldPricePer375g;
    private Double calculatedGoldPrice;
    private Double baseLaborFee;
    private Double stoneFee;
    private Double finalBillingAmount;
}
