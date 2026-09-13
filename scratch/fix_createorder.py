import codecs

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    content = f.read()

target = """            WorkOrder wo = WorkOrder.builder()
                    .orderItemId(orderItem.getId())
                    .currentStage("PENDING")
                    .isHold(false)
                    .createdAt(LocalDateTime.now())
                    .build();"""

replacement = """            WorkOrder wo = WorkOrder.builder()
                    .orderItemId(orderItem.getId())
                    .currentStage("PENDING")
                    .isHold(false)
                    .createdAt(LocalDateTime.now())
                    .template(templateRepository.findAll().stream().findFirst().orElse(null))
                    .build();"""

content = content.replace(target, replacement)
# And fix lambda compilation error again
bad_line = "String rep = all.stream()\n                .min(Comparator.comparingInt(this::stageIndex))\n                .map(WorkOrder::getCurrentStage)\n                .orElse(newStage);"

good_code = """
        String rep = newStage;
        WorkOrder minWo = null;
        int minIdx = 999;
        for (WorkOrder w : all) {
            int idx = stageIndex(w);
            if (idx < minIdx) {
                minIdx = idx;
                minWo = w;
            }
        }
        if (minWo != null && minWo.getCurrentStage() != null) {
            rep = minWo.getCurrentStage();
        }
"""
content = content.replace(bad_line, good_code)

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(content)
