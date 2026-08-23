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
    
    @Column(name = "pending_completed_at")
    private LocalDateTime pendingCompletedAt;
    @Column(name = "cad_completed_at")
    private LocalDateTime cadCompletedAt;
    @Column(name = "casting_completed_at")
    private LocalDateTime castingCompletedAt;
    @Column(name = "polishing_completed_at")
    private LocalDateTime polishingCompletedAt;
    @Column(name = "plating_completed_at")
    private LocalDateTime platingCompletedAt;
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
