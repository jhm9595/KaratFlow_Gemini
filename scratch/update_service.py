import re

with open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', encoding='utf-8') as f:
    text = f.read()

old_dto_map = r'''                \.isHold\(\(Boolean\) row\.get\("ISHOLD"\)\)
                \.engravingText\(\(String\) row\.get\("ENGRAVINGTEXT"\)\)'''

new_dto_map = '''                .isHold((Boolean) row.get("ISHOLD"))
                .createdAt(row.get("CREATEDAT") != null ? row.get("CREATEDAT").toString() : null)
                .pendingCompletedAt(row.get("PENDINGCOMPLETEDAT") != null ? row.get("PENDINGCOMPLETEDAT").toString() : null)
                .cadCompletedAt(row.get("CADCOMPLETEDAT") != null ? row.get("CADCOMPLETEDAT").toString() : null)
                .castingCompletedAt(row.get("CASTINGCOMPLETEDAT") != null ? row.get("CASTINGCOMPLETEDAT").toString() : null)
                .polishingCompletedAt(row.get("POLISHINGCOMPLETEDAT") != null ? row.get("POLISHINGCOMPLETEDAT").toString() : null)
                .platingCompletedAt(row.get("PLATINGCOMPLETEDAT") != null ? row.get("PLATINGCOMPLETEDAT").toString() : null)
                .completedAt(row.get("COMPLETEDAT") != null ? row.get("COMPLETEDAT").toString() : null)
                .engravingText((String) row.get("ENGRAVINGTEXT"))'''
text = re.sub(old_dto_map, new_dto_map, text)

# advanceOrderStage logic
old_advance = r'''        switch \(currentStage\) \{
            case "PENDING":
            case "접수":
                nextStage = "CAD";
                break;
            case "CAD":
                nextStage = "Casting";
                break;
            case "Casting":
            case "주물":
                nextStage = "Polishing";
                break;
            case "Polishing":
            case "세공":
                nextStage = "Plating/Inspection";
                break;
            case "Plating/Inspection":
            case "도금":
            case "검수":
                nextStage = "Completed";
                order\.setStatus\("COMPLETED"\);
                orderRepository\.save\(order\);
                break;
            default:
                nextStage = "Completed";
                order\.setStatus\("COMPLETED"\);
                orderRepository\.save\(order\);
                break;
        \}'''

new_advance = '''        switch (currentStage) {
            case "PENDING":
            case "접수":
                nextStage = "CAD";
                workOrder.setPendingCompletedAt(LocalDateTime.now());
                break;
            case "CAD":
                nextStage = "Casting";
                workOrder.setCadCompletedAt(LocalDateTime.now());
                break;
            case "Casting":
            case "주물":
                nextStage = "Polishing";
                workOrder.setCastingCompletedAt(LocalDateTime.now());
                break;
            case "Polishing":
            case "세공":
                nextStage = "Plating/Inspection";
                workOrder.setPolishingCompletedAt(LocalDateTime.now());
                break;
            case "Plating/Inspection":
            case "도금":
            case "검수":
                nextStage = "Completed";
                workOrder.setPlatingCompletedAt(LocalDateTime.now());
                workOrder.setCompletedAt(LocalDateTime.now());
                order.setStatus("COMPLETED");
                orderRepository.save(order);
                break;
            default:
                nextStage = "Completed";
                workOrder.setCompletedAt(LocalDateTime.now());
                order.setStatus("COMPLETED");
                orderRepository.save(order);
                break;
        }'''
text = re.sub(old_advance, new_advance, text)

with open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', encoding='utf-8') as f:
    f.write(text)

print("OrderService updated!")
