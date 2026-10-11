package com.minibig.karatflow.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(
    name = "work_orders",
    indexes = {
        @Index(name = "idx_work_orders_item_stage", columnList = "order_item_id, current_stage"),
        @Index(name = "idx_work_orders_no", columnList = "work_order_no")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkOrder extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_order_id")
    private Long id;

    @Column(name = "work_order_no", unique = true)
    private String workOrderNo; // WO-260829-00001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @Column(name = "current_stage")
    private String currentStage;

    @Column(name = "is_hold")
    private Boolean isHold;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ProcessTemplate template;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public static String generateWorkOrderNo(String orderNo, int sequence) {
        if (orderNo == null || orderNo.trim().isEmpty()) {
            String date = DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now());
            return "ORD-" + date + "-000-" + String.format("%02d", sequence);
        }
        return orderNo + "-" + String.format("%02d", sequence);
    }

    public static String generateWorkOrderNo(Long id) {
        String date = DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now());
        return "ORD-" + date + "-" + String.format("%03d", id % 1000) + "-01";
    }
}
