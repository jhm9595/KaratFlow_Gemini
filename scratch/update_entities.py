import re

# 1. Update WorkOrder.java
with open('backend/src/main/java/com/minibig/karatflow/backend/domain/WorkOrder.java', 'r', encoding='utf-8') as f:
    text = f.read()

new_fields = '''    @Column(name = "created_at")
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
    private LocalDateTime completedAt;'''
text = re.sub(r'@Column\(name = "created_at"\)\s*private LocalDateTime createdAt;', new_fields, text)

with open('backend/src/main/java/com/minibig/karatflow/backend/domain/WorkOrder.java', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update OrderResponseDTO.java
with open('backend/src/main/java/com/minibig/karatflow/backend/dto/OrderResponseDTO.java', 'r', encoding='utf-8') as f:
    text = f.read()

new_dto_fields = '''    private String status;
    private Double cancellationFee;
    
    private String createdAt;
    private String pendingCompletedAt;
    private String cadCompletedAt;
    private String castingCompletedAt;
    private String polishingCompletedAt;
    private String platingCompletedAt;
    private String completedAt;'''
text = re.sub(r'private String status;\s*private Double cancellationFee;', new_dto_fields, text)

with open('backend/src/main/java/com/minibig/karatflow/backend/dto/OrderResponseDTO.java', 'w', encoding='utf-8') as f:
    f.write(text)

print("Entities updated!")
