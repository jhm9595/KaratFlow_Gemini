package com.minibig.karatflow.backend.dto;

import lombok.Data;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
public class SubcontractTaskDTO {
    private Long id;
    private Long orderId;
    private String taskName;
    private String subcontractorName;
    private BigDecimal dispatchedWeightG;
    private BigDecimal receivedWeightG;
    private BigDecimal lossWeightG;
    private BigDecimal agreedLaborFee;
    private String status;
    private LocalDateTime dispatchedAt;
    private LocalDateTime receivedAt;
}
