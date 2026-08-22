package com.minibig.karatflow.backend.dto;

import lombok.Data;
import lombok.Builder;
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
    private Double dispatchedWeightG;
    private Double receivedWeightG;
    private Double lossWeightG;
    private Double agreedLaborFee;
    private String status;
    private LocalDateTime dispatchedAt;
    private LocalDateTime receivedAt;
}
