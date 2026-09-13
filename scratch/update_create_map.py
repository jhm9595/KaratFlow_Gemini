import re

with open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', encoding='utf-8') as f:
    text = f.read()

old_create_map = r'''                \.stage\(workOrder\.getCurrentStage\(\)\)
                \.isHold\(workOrder\.getIsHold\(\)\)'''

new_create_map = '''                .stage(workOrder.getCurrentStage())
                .isHold(workOrder.getIsHold())
                .createdAt(workOrder.getCreatedAt() != null ? workOrder.getCreatedAt().toString() : null)
                .pendingCompletedAt(workOrder.getPendingCompletedAt() != null ? workOrder.getPendingCompletedAt().toString() : null)
                .cadCompletedAt(workOrder.getCadCompletedAt() != null ? workOrder.getCadCompletedAt().toString() : null)
                .castingCompletedAt(workOrder.getCastingCompletedAt() != null ? workOrder.getCastingCompletedAt().toString() : null)
                .polishingCompletedAt(workOrder.getPolishingCompletedAt() != null ? workOrder.getPolishingCompletedAt().toString() : null)
                .platingCompletedAt(workOrder.getPlatingCompletedAt() != null ? workOrder.getPlatingCompletedAt().toString() : null)
                .completedAt(workOrder.getCompletedAt() != null ? workOrder.getCompletedAt().toString() : null)'''

text = re.sub(old_create_map, new_create_map, text)

with open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', encoding='utf-8') as f:
    f.write(text)

print("createOrder mapping updated!")
