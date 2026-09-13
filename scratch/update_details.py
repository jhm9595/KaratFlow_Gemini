import codecs

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'r', 'utf-8') as f:
    text = f.read()

details_method = """    @Transactional(readOnly = true)
    public com.minibig.karatflow.backend.domain.OrderDetailDTO getOrderDetails(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        OrderItem oi = orderItemRepository.findByOrderId(orderId).orElseThrow();
        Design d = oi.getDesign();
        List<WorkOrder> workOrders = workOrderRepository.findAllByOrderId(orderId);
        
        List<com.minibig.karatflow.backend.domain.OrderDetailDTO.WorkOrderDTO> woDTOs = workOrders.stream().map(w -> 
            com.minibig.karatflow.backend.domain.OrderDetailDTO.WorkOrderDTO.builder()
                .id(w.getId())
                .stage(w.getCurrentStage())
                .isHold(w.getIsHold())
                .createdAt(w.getCreatedAt() != null ? w.getCreatedAt().toString() : null)
                .build()
        ).collect(Collectors.toList());

        return com.minibig.karatflow.backend.domain.OrderDetailDTO.builder()
                .orderId(order.getId())
                .orderNo(order.getOrderNo())
                .brand(d != null ? d.getBrand() : oi.getUnmappedBrandName())
                .designCode(d != null ? d.getDesignCode() : null)
                .productName(d != null ? d.getName() : oi.getUnmappedProductName())
                .imageUrl(oi.getImageUrl() != null ? oi.getImageUrl() : (d != null ? d.getImageUrl() : null))
                .quantity(oi.getQuantity())
                .workOrders(woDTOs)
                .build();
    }
"""

text = text.replace('public List<OrderResponseDTO> getDashboardOrders() {', details_method + '\n    public List<OrderResponseDTO> getDashboardOrders() {')

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/OrderService.java', 'w', 'utf-8') as f:
    f.write(text)

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/controller/OrderController.java', 'r', 'utf-8') as f:
    text2 = f.read()

controller_method = """    @GetMapping("/{id}/details")
    public ResponseEntity<com.minibig.karatflow.backend.domain.OrderDetailDTO> getOrderDetails(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderDetails(id));
    }
"""

text2 = text2.replace('public ResponseEntity<List<OrderResponseDTO>> getOrders() {', controller_method + '\n    public ResponseEntity<List<OrderResponseDTO>> getOrders() {')

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/controller/OrderController.java', 'w', 'utf-8') as f:
    f.write(text2)
