package com.minibig.karatflow.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "subcontract_tasks",
    indexes = {
        @Index(name = "idx_subcontract_order_status", columnList = "order_id, status")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubcontractTask extends BaseEntity {
    
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private String taskName; // e.g. "도금", "레이저각인", "주물"

    @Column(nullable = false)
    private String subcontractorName;

    @Column(name = "dispatched_weight_g", nullable = false, precision = 15, scale = 4)
    private BigDecimal dispatchedWeightG;

    @Column(name = "received_weight_g", precision = 15, scale = 4)
    private BigDecimal receivedWeightG;

    @Column(name = "loss_weight_g", precision = 15, scale = 4)
    private BigDecimal lossWeightG; // Auto calculated

    @Column(name = "agreed_labor_fee", nullable = false, precision = 15, scale = 2)
    private BigDecimal agreedLaborFee;

    @Column(nullable = false)
    private String status; // "DISPATCHED", "RECEIVED"

    private LocalDateTime dispatchedAt;
    
    private LocalDateTime receivedAt;
}
