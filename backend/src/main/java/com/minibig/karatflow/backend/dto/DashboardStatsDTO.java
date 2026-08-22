package com.minibig.karatflow.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsDTO {
    private Double totalRevenue;
    private Long activeOrders;
    private Long totalOrders;
    private Double cancellationRate;
}
