import codecs

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    text = f.read()

old_dto = """                .date(order.getOrderDate().toString())
                .stage(workOrder.getCurrentStage())
                .isHold(workOrder.getIsHold())
                .createdAt(workOrder.getCreatedAt() != null ? workOrder.getCreatedAt().toString() : null)
                .pendingCompletedAt(workOrder.getPendingCompletedAt() != null ? workOrder.getPendingCompletedAt().toString() : null)
                .cadCompletedAt(workOrder.getCadCompletedAt() != null ? workOrder.getCadCompletedAt().toString() : null)
                .castingCompletedAt(workOrder.getCastingCompletedAt() != null ? workOrder.getCastingCompletedAt().toString() : null)
                .polishingCompletedAt(workOrder.getPolishingCompletedAt() != null ? workOrder.getPolishingCompletedAt().toString() : null)
                .platingCompletedAt(workOrder.getPlatingCompletedAt() != null ? workOrder.getPlatingCompletedAt().toString() : null)
                .completedAt(workOrder.getCompletedAt() != null ? workOrder.getCompletedAt().toString() : null)
                .designCode(design != null ? design.getDesignCode() : null)"""

new_dto = """                .date(order.getOrderDate().toString())
                .stage("PENDING")
                .isHold(false)
                .createdAt(LocalDateTime.now().toString())
                .pendingCompletedAt(null)
                .cadCompletedAt(null)
                .castingCompletedAt(null)
                .polishingCompletedAt(null)
                .platingCompletedAt(null)
                .completedAt(null)
                .designCode(design != null ? design.getDesignCode() : null)"""

text = text.replace(old_dto.replace('\n', '\r\n'), new_dto.replace('\n', '\r\n'))
text = text.replace(old_dto, new_dto)

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(text)
