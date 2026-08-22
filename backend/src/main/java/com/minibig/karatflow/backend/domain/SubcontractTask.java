package com.minibig.karatflow.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subcontract_tasks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubcontractTask {
    
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private String taskName; // e.g. "도금", "레이저각인", "주물"

    @Column(nullable = false)
    private String subcontractorName;

    @Column(nullable = false)
    private Double dispatchedWeightG;

    private Double receivedWeightG;

    private Double lossWeightG; // Auto calculated

    @Column(nullable = false)
    private Double agreedLaborFee;

    @Column(nullable = false)
    private String status; // "DISPATCHED", "RECEIVED"

    private LocalDateTime dispatchedAt;
    
    private LocalDateTime receivedAt;
}
