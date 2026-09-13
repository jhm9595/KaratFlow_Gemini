import codecs

additional_methods = '''
    @Transactional
    public void setOrderHoldStatus(Long orderId, boolean hold) {
        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);
        wos.forEach(w -> { w.setIsHold(hold); workOrderRepository.save(w); });
    }

    @Transactional
    public java.util.Map<String, Object> advanceOrderStage(Long orderId) {
        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);
        if (wos.isEmpty()) throw new IllegalStateException("No work orders for order " + orderId);
        // Advance the first non-completed WorkOrder
        WorkOrder target = wos.stream()
                .filter(w -> !"COMPLETED".equals(w.getCurrentStage()))
                .findFirst()
                .orElse(wos.get(0));
        String newStage = nextStage(target.getCurrentStage());
        target.setCurrentStage(newStage);
        setStageTimestamp(target, newStage);
        workOrderRepository.save(target);

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("workOrderId", target.getId());
        res.put("newStage", newStage);
        res.put("orderId", orderId);
        return res;
    }

    public Double calculateCancelEstimate(Long orderId) {
        List<WorkOrder> wos = workOrderRepository.findAllByOrderId(orderId);
        if (wos.isEmpty()) return 0.0;
        String stage = wos.get(0).getCurrentStage();
        return switch (stage) {
            case "PENDING" -> 0.0;
            case "CAD" -> 50000.0;
            case "CASTING" -> 150000.0;
            case "POLISHING" -> 200000.0;
            case "PLATING" -> 250000.0;
            case "COMPLETED" -> 300000.0;
            default -> 0.0;
        };
    }

    @Transactional
    public java.util.Map<String, Object> cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        Double fee = calculateCancelEstimate(orderId);
        order.setStatus("CANCELLED");
        order.setCancellationFee(fee);
        orderRepository.save(order);
        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("orderId", orderId);
        res.put("cancellationFee", fee);
        res.put("status", "CANCELLED");
        return res;
    }

    public OrderResponseDTO getOrderById(Long orderId) {
        return getDashboardOrders().stream()
                .filter(o -> orderId.equals(o.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
    }
'''

with codecs.open(
    'backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java',
    'r', 'utf-8'
) as f:
    text = f.read()

# Insert before the last closing brace
last_brace = text.rfind('\n}')
text = text[:last_brace] + additional_methods + '\n}'

with codecs.open(
    'backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java',
    'w', 'utf-8'
) as f:
    f.write(text)

print("Additional methods injected successfully")
