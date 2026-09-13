package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_order_histories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkOrderHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id")
    private WorkOrder workOrder;

    @Column(name = "step_name")
    private String stepName; // e.g. "CAD", "주조", "세공"

    @Column(name = "step_order")
    private Integer stepOrder;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
