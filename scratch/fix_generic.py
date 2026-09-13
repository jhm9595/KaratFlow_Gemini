import codecs
import re

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    content = f.read()

content = re.sub(r'String rep = all\.stream\(\)[\s\S]*?\.orElse\(newStage\);', """String rep = newStage;
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
        }""", content)

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(content)
