import codecs
import re
import os

# 1. Restore file
os.system('git checkout backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java')

# 2. Read clean file
with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    content = f.read()

# 3. Add imports and Repositories
imports = """
import com.minibig.karatflow.backend.domain.WorkOrderHistory;
import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.domain.ProcessTemplateStep;
import com.minibig.karatflow.backend.repository.WorkOrderHistoryRepository;
import com.minibig.karatflow.backend.repository.ProcessTemplateRepository;
"""
content = content.replace("import com.minibig.karatflow.backend.domain.WorkOrder;", "import com.minibig.karatflow.backend.domain.WorkOrder;\n" + imports)

repos = """
    private final WorkOrderHistoryRepository historyRepository;
    private final ProcessTemplateRepository templateRepository;
"""
content = content.replace("private final OrderRepository orderRepository;", "private final OrderRepository orderRepository;\n" + repos)

# 4. Inject Default Template in createOrder
content = content.replace("public OrderResponseDTO createOrder(OrderRequestDTO req) {", """public OrderResponseDTO createOrder(OrderRequestDTO req) {
        ProcessTemplate defaultTemplate = templateRepository.findAll().stream().findFirst().orElse(null);
""")
create_order_regex = r'(WorkOrder wo = WorkOrder\.builder\(\).*?)(build\(\);)'
def create_order_repl(m):
    return m.group(1) + "template(defaultTemplate).\n                        " + m.group(2)
content = re.sub(create_order_regex, create_order_repl, content, flags=re.DOTALL)


# 5. Inject timelineEvents logic in getOrderDetails
timeline_logic = """
        List<OrderDetailDTO.TimelineEventDTO> timeline = new java.util.ArrayList<>();
        if (!wos.isEmpty()) {
            WorkOrder firstWo = wos.get(0);
            if (firstWo.getTemplate() != null && firstWo.getTemplate().getSteps() != null) {
                List<WorkOrderHistory> histories = historyRepository.findByWorkOrderIdOrderByStepOrderAsc(firstWo.getId());
                java.util.Map<String, String> historyMap = histories.stream()
                    .collect(java.util.stream.Collectors.toMap(
                        WorkOrderHistory::getStepName, 
                        h -> h.getCompletedAt().toString(),
                        (existing, replacement) -> existing
                    ));
                    
                for (ProcessTemplateStep step : firstWo.getTemplate().getSteps()) {
                    timeline.add(OrderDetailDTO.TimelineEventDTO.builder()
                        .stage(step.getStepName())
                        .date(historyMap.get(step.getStepName()))
                        .icon(step.getIcon() != null ? step.getIcon() : "pi pi-circle")
                        .color(step.getColor() != null ? step.getColor() : "#9E9E9E")
                        .build());
                }
            }
        }
"""
content = content.replace("List<OrderDetailDTO.WorkOrderDTO> woDTOs = wos.stream().map(w ->", timeline_logic + "\n        List<OrderDetailDTO.WorkOrderDTO> woDTOs = wos.stream().map(w ->")
content = content.replace(".workOrders(woDTOs)\n                .build();", ".workOrders(woDTOs)\n                .timelineEvents(timeline)\n                .build();")

# 6. Replace Helper Methods
content = re.sub(r'// ─── Helpers ───.*', '', content, flags=re.DOTALL) # Delete from Helpers down

new_helpers = """// ─── Helpers ──────────────────────────────────────────────────────────────

    private ProcessTemplateStep getCurrentStep(WorkOrder wo) {
        if (wo.getTemplate() == null || wo.getTemplate().getSteps() == null) return null;
        return wo.getTemplate().getSteps().stream()
                .filter(s -> s.getStepName().equals(wo.getCurrentStage()))
                .findFirst().orElse(null);
    }

    private String nextStage(WorkOrder wo) {
        if (wo.getTemplate() == null || wo.getTemplate().getSteps() == null) {
            String curr = wo.getCurrentStage() != null ? wo.getCurrentStage() : "";
            return switch (curr) {
                case "PENDING" -> "CAD";
                case "CAD" -> "CASTING";
                case "CASTING" -> "POLISHING";
                case "POLISHING" -> "PLATING";
                case "PLATING" -> "COMPLETED";
                default -> "COMPLETED";
            };
        }
        
        ProcessTemplateStep current = getCurrentStep(wo);
        if (current == null) {
            return wo.getTemplate().getSteps().isEmpty() ? "COMPLETED" : wo.getTemplate().getSteps().get(0).getStepName();
        }
        
        return wo.getTemplate().getSteps().stream()
                .filter(s -> s.getStepOrder() > current.getStepOrder())
                .findFirst()
                .map(ProcessTemplateStep::getStepName)
                .orElse("COMPLETED");
    }

    private int stageIndex(WorkOrder wo) {
        ProcessTemplateStep step = getCurrentStep(wo);
        return step != null ? step.getStepOrder() : 99;
    }

    private void recordHistory(WorkOrder wo, String stage) {
        ProcessTemplateStep step = getCurrentStep(wo);
        int order = step != null ? step.getStepOrder() : 0;
        
        WorkOrderHistory history = WorkOrderHistory.builder()
                .workOrder(wo)
                .stepName(stage)
                .stepOrder(order)
                .completedAt(LocalDateTime.now())
                .build();
        historyRepository.save(history);
        
        if ("COMPLETED".equals(stage)) {
            wo.setCompletedAt(LocalDateTime.now());
        }
    }
}
"""
content = content + new_helpers

# 7. Update calls
content = content.replace("String newStage = nextStage(target.getCurrentStage());", "String newStage = nextStage(target);")
content = content.replace("setStageTimestamp(target, newStage);", "recordHistory(target, newStage);")
content = content.replace("String newStage = nextStage(wo.getCurrentStage());", "String newStage = nextStage(wo);")
content = content.replace("setStageTimestamp(wo, newStage);", "recordHistory(wo, newStage);")
content = content.replace("Comparator.comparingInt(OrderService::stageIndex)", "Comparator.comparingInt(this::stageIndex)")

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(content)
print("Complete Refactor OK")
