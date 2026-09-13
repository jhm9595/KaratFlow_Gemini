import codecs
import re

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    text = f.read()

old_code = """        WorkOrder workOrder = WorkOrder.builder()
                .orderItemId(orderItem.getId())
                .currentStage("PENDING")
                .isHold(false)
                .createdAt(LocalDateTime.now())
                .build();
        workOrderRepository.save(workOrder);"""

new_code = """        int qty = orderItem.getQuantity() != null ? orderItem.getQuantity() : 1;
        for (int i = 0; i < qty; i++) {
            WorkOrder workOrder = WorkOrder.builder()
                    .orderItemId(orderItem.getId())
                    .currentStage("PENDING")
                    .isHold(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            workOrderRepository.save(workOrder);
        }"""

text = text.replace(old_code.replace('\n', '\r\n'), new_code.replace('\n', '\r\n'))
text = text.replace(old_code, new_code)

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(text)
