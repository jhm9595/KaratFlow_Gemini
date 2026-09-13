import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Add ProcessTemplate imports
imports_to_add = """import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.domain.ProcessTemplateStep;
import com.minibig.karatflow.backend.domain.WorkOrderProgress;
import com.minibig.karatflow.backend.repository.ProcessTemplateRepository;
"""
content = content.replace("import com.minibig.karatflow.backend.domain.WorkOrder;", imports_to_add + "import com.minibig.karatflow.backend.domain.WorkOrder;")

# Add processTemplateRepository to fields
fields_to_add = """    private final OrderItemRepository orderItemRepository;
    private final DesignRepository designRepository;
    private final ProcessTemplateRepository processTemplateRepository;
"""
content = re.sub(r'private final OrderItemRepository orderItemRepository;\s*private final DesignRepository designRepository;', fields_to_add.strip(), content)

# WorkOrder creation logic
new_creation_logic = """
        ProcessTemplate defaultTemplate = processTemplateRepository.findAll().stream().findFirst().orElse(null);

        int qty = orderItem.getQuantity() != null ? orderItem.getQuantity() : 1;
        for (int i = 0; i < qty; i++) {
            WorkOrder wo = WorkOrder.builder()
                    .orderItemId(orderItem.getId())
                    .processTemplate(defaultTemplate)
                    .currentStage("PENDING")
                    .isHold(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            wo = workOrderRepository.save(wo);
            wo.setWorkOrderNo(WorkOrder.generateWorkOrderNo(wo.getId()));
            
            // Generate progress steps
            if (defaultTemplate != null && defaultTemplate.getSteps() != null) {
                for (ProcessTemplateStep step : defaultTemplate.getSteps()) {
                    WorkOrderProgress progress = WorkOrderProgress.builder()
                            .workOrder(wo)
                            .step(step)
                            .status("PENDING")
                            .build();
                    wo.getProgressList().add(progress);
                }
            }
            workOrderRepository.save(wo);
        }
"""
content = re.sub(r'int qty = orderItem\.getQuantity\(\)[\s\S]*?workOrderRepository\.save\(wo\);\s*\}', new_creation_logic.strip(), content)

# Advance Stage logic
advance_logic = """
    private String nextStage(WorkOrder wo) {
        if (wo.getProcessTemplate() == null || wo.getProcessTemplate().getSteps().isEmpty()) {
            // Fallback for old orders
            return switch (wo.getCurrentStage()) {
                case "PENDING" -> "CAD";
                case "CAD" -> "CASTING";
                case "CASTING" -> "POLISHING";
                case "POLISHING" -> "PLATING";
                case "PLATING" -> "COMPLETED";
                default -> "COMPLETED";
            };
        }
        
        List<ProcessTemplateStep> steps = wo.getProcessTemplate().getSteps();
        String current = wo.getCurrentStage();
        if ("PENDING".equals(current)) {
            return steps.get(0).getName();
        }
        for (int i = 0; i < steps.size(); i++) {
            if (steps.get(i).getName().equals(current)) {
                if (i + 1 < steps.size()) {
                    return steps.get(i + 1).getName();
                } else {
                    return "COMPLETED";
                }
            }
        }
        return "COMPLETED";
    }

    private int stageIndex(String stage, ProcessTemplate template) {
        if (template == null) {
            return switch (stage) {
                case "PENDING" -> 0;
                case "CAD" -> 1;
                case "CASTING" -> 2;
                case "POLISHING" -> 3;
                case "PLATING" -> 4;
                case "COMPLETED" -> 5;
                default -> 99;
            };
        }
        if ("PENDING".equals(stage)) return -1;
        if ("COMPLETED".equals(stage)) return 999;
        
        List<ProcessTemplateStep> steps = template.getSteps();
        for (int i = 0; i < steps.size(); i++) {
            if (steps.get(i).getName().equals(stage)) {
                return i;
            }
        }
        return 99;
    }

    private void updateStageProgress(WorkOrder wo, String oldStage, String newStage) {
        LocalDateTime now = LocalDateTime.now();
        if ("COMPLETED".equals(newStage)) {
            wo.setCompletedAt(now);
        }
        
        if (wo.getProgressList() != null) {
            for (WorkOrderProgress p : wo.getProgressList()) {
                if (p.getStep().getName().equals(oldStage)) {
                    p.setStatus("COMPLETED");
                    p.setCompletedAt(now);
                }
                if (p.getStep().getName().equals(newStage)) {
                    p.setStatus("IN_PROGRESS");
                    p.setStartedAt(now);
                }
            }
        }
    }

    @Transactional
    public OrderResponseDTO advanceStage(Long workOrderId) {
        WorkOrder wo = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found: " + workOrderId));
        String oldStage = wo.getCurrentStage();
        String newStage = nextStage(wo);
        wo.setCurrentStage(newStage);
        updateStageProgress(wo, oldStage, newStage);
        workOrderRepository.save(wo);
        
        OrderItem oi = orderItemRepository.findById(wo.getOrderItemId()).orElseThrow();
        Order order = oi.getOrder();
        Design d = oi.getDesign();
        List<WorkOrder> all = workOrderRepository.findAllByOrderId(order.getId());
        String rep = all.stream().map(WorkOrder::getCurrentStage)
                .min((s1, s2) -> Integer.compare(stageIndex(s1, wo.getProcessTemplate()), stageIndex(s2, wo.getProcessTemplate()))).orElse(newStage);
        
        return OrderResponseDTO.builder()
                .id(order.getId()).orderNo(order.getOrderNo()).shortCode(order.getShortCode())
                .design(d != null ? d.getDesignCode() : null)
                .brand(d != null ? d.getBrand() : oi.getUnmappedBrandName())
                .imageUrl(oi.getImageUrl() != null ? oi.getImageUrl() : (d != null ? d.getImageUrl() : null))
                .quantity(oi.getQuantity()).unmappedProductName(oi.getUnmappedProductName())
                .date(order.getOrderDate().toString()).stage(rep)
                .isHold(all.stream().anyMatch(w -> Boolean.TRUE.equals(w.getIsHold())))
                .orderType(order.getOrderType()).customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone()).status(order.getStatus())
                .build();
    }
"""

# Replace advanceStage methods
content = re.sub(r'@Transactional\s*public OrderResponseDTO advanceStage[\s\S]*?setStageTimestamp\(wo, newStage\);\s*\}', advance_logic, content)

# Remove the old private helpers (nextStage, stageIndex, setStageTimestamp) since we redefined them
content = re.sub(r'private String nextStage\(String current\)[\s\S]*?\}\s*\}', '', content)
content = re.sub(r'private static int stageIndex\(String stage\)[\s\S]*?\}\s*\}', '', content)
content = re.sub(r'private void setStageTimestamp\(WorkOrder wo, String stage\)[\s\S]*?\}\s*\}', '', content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("OrderService.java rewritten.")
