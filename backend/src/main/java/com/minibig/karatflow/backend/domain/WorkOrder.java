package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "work_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_order_id")
    private Long id;

    @Column(name = "work_order_no", unique = true)
    private String workOrderNo; // 바코드 식별자: WO-260829-00001

    @Column(name = "order_item_id")
    private Long orderItemId;

    @Column(name = "current_stage")
    private String currentStage;

    @Column(name = "is_hold")
    private Boolean isHold;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ProcessTemplate template;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public static String generateWorkOrderNo(Long id) {
        String date = DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now());
        return "WO-" + date + "-" + String.format("%05d", id % 100000);
    }
}
