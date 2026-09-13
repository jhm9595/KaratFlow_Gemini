import codecs
import re

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    content = f.read()

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

content = content.replace("workOrderRepository.saveAll(wos);", """
        ProcessTemplate defaultTemplate = templateRepository.findAll().stream().findFirst().orElse(null);
        wos.forEach(wo -> wo.setTemplate(defaultTemplate));
        workOrderRepository.saveAll(wos);
""")

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
                        .stage(step.getStageName() != null ? step.getStageName() : step.getStageCode())
                        .date(historyMap.get(step.getStageCode()))
                        .icon("pi pi-circle")
                        .color("#9E9E9E")
                        .build());
                }
            }
        }
"""
content = content.replace("List<OrderDetailDTO.WorkOrderDTO> woDTOs = wos.stream().map(w ->", timeline_logic + "\n        List<OrderDetailDTO.WorkOrderDTO> woDTOs = wos.stream().map(w ->")
content = content.replace(".workOrders(woDTOs)\n                .build();", ".workOrders(woDTOs)\n                .timelineEvents(timeline)\n                .build();")

content = re.sub(r'// ─── Helpers ───.*', '', content, flags=re.DOTALL) 

new_helpers = """// ─── Helpers ──────────────────────────────────────────────────────────────

    private ProcessTemplateStep getCurrentStep(WorkOrder wo) {
        if (wo.getTemplate() == null || wo.getTemplate().getSteps() == null) return null;
        return wo.getTemplate().getSteps().stream()
                .filter(s -> s.getStageCode().equals(wo.getCurrentStage()))
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
            return wo.getTemplate().getSteps().isEmpty() ? "COMPLETED" : wo.getTemplate().getSteps().get(0).getStageCode();
        }
        
        return wo.getTemplate().getSteps().stream()
                .filter(s -> s.getStepOrder() > current.getStepOrder())
                .findFirst()
                .map(ProcessTemplateStep::getStageCode)
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

content = content.replace("String newStage = nextStage(target.getCurrentStage());", "String newStage = nextStage(target);")
content = content.replace("setStageTimestamp(target, newStage);", "recordHistory(target, newStage);")
content = content.replace("String newStage = nextStage(wo.getCurrentStage());", "String newStage = nextStage(wo);")
content = content.replace("setStageTimestamp(wo, newStage);", "recordHistory(wo, newStage);")
content = content.replace("Comparator.comparingInt(OrderService::stageIndex)", "Comparator.comparingInt(this::stageIndex)")

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(content)
print("Complete Refactor OK")
