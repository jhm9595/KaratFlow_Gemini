import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Add imports
imports = """
import com.minibig.karatflow.backend.domain.WorkOrderHistory;
import com.minibig.karatflow.backend.domain.ProcessTemplate;
import com.minibig.karatflow.backend.domain.ProcessTemplateStep;
import com.minibig.karatflow.backend.repository.WorkOrderHistoryRepository;
import com.minibig.karatflow.backend.repository.ProcessTemplateRepository;
"""
content = content.replace("import com.minibig.karatflow.backend.domain.WorkOrder;", "import com.minibig.karatflow.backend.domain.WorkOrder;\n" + imports)

# Add Repositories
repos = """
    private final WorkOrderHistoryRepository historyRepository;
    private final ProcessTemplateRepository templateRepository;
"""
content = content.replace("private final OrderRepository orderRepository;", "private final OrderRepository orderRepository;\n" + repos)

# Replace nextStage and stageIndex and setStageTimestamp
# First, let's remove the old helpers
content = re.sub(r'private String nextStage.*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'private static int stageIndex.*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'private void setStageTimestamp.*?\}', '', content, flags=re.DOTALL)

# Refactor createOrder to assign default template
create_order_regex = r'(WorkOrder wo = WorkOrder\.builder\(\).*?)(build\(\);)'
def create_order_repl(m):
    return m.group(1) + "template(defaultTemplate).\n                        " + m.group(2)

content = content.replace("public OrderResponseDTO createOrder(OrderRequestDTO req) {", """public OrderResponseDTO createOrder(OrderRequestDTO req) {
        ProcessTemplate defaultTemplate = templateRepository.findAll().stream().findFirst().orElse(null);
""")
content = re.sub(create_order_regex, create_order_repl, content, flags=re.DOTALL)

new_helpers = """
    private ProcessTemplateStep getCurrentStep(WorkOrder wo) {
        if (wo.getTemplate() == null || wo.getTemplate().getSteps() == null) return null;
        return wo.getTemplate().getSteps().stream()
                .filter(s -> s.getStepName().equals(wo.getCurrentStage()))
                .findFirst().orElse(null);
    }

    private String nextStage(WorkOrder wo) {
        if (wo.getTemplate() == null || wo.getTemplate().getSteps() == null) {
            // Fallback
            return switch (wo.getCurrentStage()) {
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
"""
content = content + new_helpers

# Update advanceOrderStage
content = content.replace("String newStage = nextStage(target.getCurrentStage());", "String newStage = nextStage(target);")
content = content.replace("setStageTimestamp(target, newStage);", "recordHistory(target, newStage);")

# Update advanceStage(Long workOrderId)
content = content.replace("String newStage = nextStage(wo.getCurrentStage());", "String newStage = nextStage(wo);")
content = content.replace("setStageTimestamp(wo, newStage);", "recordHistory(wo, newStage);")
content = content.replace("Comparator.comparingInt(OrderService::stageIndex)", "Comparator.comparingInt(this::stageIndex)")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
