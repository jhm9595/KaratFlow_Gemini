import codecs
import re

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    text = f.read()

text = re.sub(r'workOrder\.getCurrentStage\(\)', '"PENDING"', text)
text = re.sub(r'workOrder\.getIsHold\(\)', 'false', text)
text = re.sub(r'workOrder\.getCreatedAt\(\) != null \? workOrder\.getCreatedAt\(\)\.toString\(\) : null', 'java.time.LocalDateTime.now().toString()', text)
text = re.sub(r'workOrder\.get[a-zA-Z]+CompletedAt\(\) != null \? workOrder\.get[a-zA-Z]+CompletedAt\(\)\.toString\(\) : null', 'null', text)
text = re.sub(r'workOrder\.getCompletedAt\(\) != null \? workOrder\.getCompletedAt\(\)\.toString\(\) : null', 'null', text)

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(text)
