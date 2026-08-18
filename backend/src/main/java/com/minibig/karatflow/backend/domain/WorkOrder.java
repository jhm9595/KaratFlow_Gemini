package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_order_id")
    private Long id;
    @Column(name = "order_item_id")
    private Long orderItemId; // Simplified relation
    @Column(name = "current_stage")
    private String currentStage;
    @Column(name = "is_hold")
    private Boolean isHold;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
