import codecs

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    content = f.read()

bad_line = "String rep = all.stream()\n                .min(Comparator.comparingInt((WorkOrder w) -> stageIndex(w)))\n                .map(WorkOrder::getCurrentStage)\n                .orElse(newStage);"

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
# also try to replace the other variants if they exist
content = content.replace("String rep = all.stream()\n                .min(Comparator.comparingInt(this::stageIndex))\n                .map(WorkOrder::getCurrentStage)\n                .orElse(newStage);", good_code)
content = content.replace("String rep = all.stream().min(Comparator.comparingInt((WorkOrder w) -> stageIndex(w))).map(WorkOrder::getCurrentStage).orElse(newStage);", good_code)

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(content)

print("Fixed backend")
