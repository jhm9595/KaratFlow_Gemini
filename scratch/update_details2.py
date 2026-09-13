import codecs

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/web/OrderController.java', 'r', 'utf-8') as f:
    text2 = f.read()

controller_method = """    @GetMapping("/{id}/details")
    public ResponseEntity<com.minibig.karatflow.backend.domain.OrderDetailDTO> getOrderDetails(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderDetails(id));
    }
"""

text2 = text2.replace('public ResponseEntity<List<OrderResponseDTO>> getOrders() {', controller_method + '\n    public ResponseEntity<List<OrderResponseDTO>> getOrders() {')

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/web/OrderController.java', 'w', 'utf-8') as f:
    f.write(text2)
