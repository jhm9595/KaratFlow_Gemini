import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# 1. Add ProcessTemplate imports
imports_to_add = """import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.domain.ProcessTemplateStep;
import com.minibig.karatflow.backend.repository.ProcessTemplateRepository;
"""
if "ProcessTemplateRepository" not in content:
    content = content.replace("import com.minibig.karatflow.backend.domain.*;", imports_to_add + "import com.minibig.karatflow.backend.domain.*;")

# 2. Add ProcessTemplateRepository field
if "private final ProcessTemplateRepository processTemplateRepository;" not in content:
    content = re.sub(r'private final DesignRepository designRepository;', 
                     'private final DesignRepository designRepository;\n    private final ProcessTemplateRepository processTemplateRepository;', 
                     content)

# 3. Modify order creation to set default process template (and start with the first step's name instead of hardcoded "PENDING")
# Find the WorkOrder.builder() inside createOrder
wo_builder_pattern = r'WorkOrder wo = WorkOrder\.builder\(\)[\s\S]*?\.createdAt\(LocalDateTime\.now\(\)\)\s*\.build\(\);'
new_wo_builder = """
            ProcessTemplate defaultTemplate = processTemplateRepository.findAll().stream().findFirst().orElse(null);
            String initialStage = (defaultTemplate != null && defaultTemplate.getSteps() != null && !defaultTemplate.getSteps().isEmpty()) 
                                    ? defaultTemplate.getSteps().get(0).getStageName() : "PENDING";
            
            WorkOrder wo = WorkOrder.builder()
                    .orderItemId(orderItem.getId())
                    .processTemplate(defaultTemplate)
                    .currentStage(initialStage)
                    .isHold(false)
                    .createdAt(LocalDateTime.now())
                    .build();
"""
if "processTemplate(defaultTemplate)" not in content:
    content = re.sub(wo_builder_pattern, new_wo_builder.strip(), content)

# 4. Modify advanceStage methods
advance_logic = """
    private String nextStage(WorkOrder wo) {
        if (wo.getProcessTemplate() == null || wo.getProcessTemplate().getSteps() == null || wo.getProcessTemplate().getSteps().isEmpty()) {
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
        for (int i = 0; i < steps.size(); i++) {
            if (steps.get(i).getStageName().equals(wo.getCurrentStage())) {
                if (i + 1 < steps.size()) {
                    return steps.get(i + 1).getStageName();
                } else {
                    return "COMPLETED";
                }
            }
        }
        return "COMPLETED";
    }

    private static int stageIndex(WorkOrder wo) {
        if (wo.getProcessTemplate() == null || wo.getProcessTemplate().getSteps() == null) {
            return switch (wo.getCurrentStage()) {
                case "PENDING" -> 0;
                case "CAD" -> 1;
                case "CASTING" -> 2;
                case "POLISHING" -> 3;
                case "PLATING" -> 4;
                case "COMPLETED" -> 5;
                default -> 99;
            };
        }
        if ("COMPLETED".equals(wo.getCurrentStage())) return 999;
        List<ProcessTemplateStep> steps = wo.getProcessTemplate().getSteps();
        for (int i = 0; i < steps.size(); i++) {
            if (steps.get(i).getStageName().equals(wo.getCurrentStage())) {
                return i;
            }
        }
        return 99;
    }

    private void setStageTimestamp(WorkOrder wo, String stage) {
        LocalDateTime now = LocalDateTime.now();
        // Fallback for legacy hardcoded dashboard query mappings
        if (stage.contains("CAD")) wo.setPendingCompletedAt(now);
        else if (stage.contains("주물") || stage.contains("CASTING")) wo.setCadCompletedAt(now);
        else if (stage.contains("세공") || stage.contains("POLISHING")) wo.setCastingCompletedAt(now);
        else if (stage.contains("도금") || stage.contains("PLATING")) wo.setPolishingCompletedAt(now);
        else if (stage.contains("완료") || stage.contains("완성") || stage.contains("COMPLETED")) wo.setCompletedAt(now);
        
        if ("COMPLETED".equals(stage)) wo.setCompletedAt(now);
    }
    
    @Transactional
    public Map<String, Object> advanceOrderStage(Long orderId) {
        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);
        if (wos.isEmpty()) throw new IllegalStateException("No work orders for order " + orderId);
        WorkOrder target = wos.stream()
                .filter(w -> !"COMPLETED".equals(w.getCurrentStage()))
                .findFirst().orElse(wos.get(0));
        String newStage = nextStage(target);
        target.setCurrentStage(newStage);
        setStageTimestamp(target, newStage);
        workOrderRepository.save(target);
        Map<String, Object> res = new HashMap<>();
        res.put("workOrderId", target.getId());
        res.put("newStage", newStage);
        res.put("orderId", orderId);
        return res;
    }

    @Transactional
    public OrderResponseDTO advanceStage(Long workOrderId) {
        WorkOrder wo = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found: " + workOrderId));
        String newStage = nextStage(wo);
        wo.setCurrentStage(newStage);
        setStageTimestamp(wo, newStage);
        workOrderRepository.save(wo);
        OrderItem oi = orderItemRepository.findById(wo.getOrderItemId()).orElseThrow();
        Order order = oi.getOrder();
        Design d = oi.getDesign();
        List<WorkOrder> all = workOrderRepository.findAllByOrderId(order.getId());
        String rep = all.stream().min((w1, w2) -> Integer.compare(stageIndex(w1), stageIndex(w2)))
                .map(WorkOrder::getCurrentStage).orElse(newStage);
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

if "private String nextStage(WorkOrder wo)" not in content:
    # replace everything from "@Transactional\n    public Map<String, Object> advanceOrderStage" to the end of the helper functions
    # I'll use regex to replace all of advanceOrderStage, advanceStage, and the helpers
    pattern = r'@Transactional\s*public Map<String, Object> advanceOrderStage[\s\S]*?private void setStageTimestamp\(WorkOrder wo, String stage\)[\s\S]*?\}\s*\}'
    content = re.sub(pattern, advance_logic + "\n}", content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("OrderService.java updated to handle dynamic templates safely.")
