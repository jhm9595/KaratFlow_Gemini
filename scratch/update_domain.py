import codecs
import os

base_path = 'backend/src/main/java/com/minibig/karatflow/backend/'

work_order_java = """package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "work_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "work_order_id")
    private Long id;

    @Column(name = "work_order_no", unique = true)
    private String workOrderNo;

    @Column(name = "order_item_id")
    private Long orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_template_id")
    private ProcessTemplate processTemplate;

    @Column(name = "current_stage")
    private String currentStage;

    @Column(name = "is_hold")
    private Boolean isHold;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkOrderProgress> progressList = new ArrayList<>();

    public static String generateWorkOrderNo(Long id) {
        String date = DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now());
        return "WO-" + date + "-" + String.format("%05d", id % 100000);
    }
}
"""

work_order_progress_java = """package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_order_progress")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkOrderProgress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id")
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_template_step_id")
    private ProcessTemplateStep step;

    @Column(name = "status")
    private String status; // e.g., "PENDING", "IN_PROGRESS", "COMPLETED"

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
"""

with codecs.open(os.path.join(base_path, 'domain/WorkOrder.java'), 'w', 'utf-8') as f:
    f.write(work_order_java)

with codecs.open(os.path.join(base_path, 'domain/WorkOrderProgress.java'), 'w', 'utf-8') as f:
    f.write(work_order_progress_java)

print("Domain classes written.")
