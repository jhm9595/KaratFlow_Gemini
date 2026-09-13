import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

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

content = content.replace(".workOrders(woDTOs)", ".workOrders(woDTOs)\n                .timelineEvents(timeline)")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("Updated OrderService.java to include dynamic timelineEvents!")
