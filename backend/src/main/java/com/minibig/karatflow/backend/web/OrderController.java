package com.minibig.karatflow.backend.web;
import com.minibig.karatflow.backend.dto.OrderResponseDTO;
import com.minibig.karatflow.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import com.minibig.karatflow.backend.dto.InvoiceResponseDTO;
import com.minibig.karatflow.backend.service.InvoiceCalculationService;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    
    private final OrderService orderService;
    private final SimpMessagingTemplate messagingTemplate;
    private final InvoiceCalculationService invoiceCalculationService;

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getActiveOrders() {
        return ResponseEntity.ok(orderService.getDashboardOrders());
    }

    @GetMapping("/stats")
    public ResponseEntity<com.minibig.karatflow.backend.dto.DashboardStatsDTO> getStats() {
        return ResponseEntity.ok(orderService.getDashboardStats());
    }

    @PostMapping
    public ResponseEntity<OrderResponseDTO> createOrder(@RequestBody com.minibig.karatflow.backend.dto.OrderCreateRequestDTO dto) {
        OrderResponseDTO created = orderService.createOrder(dto);
        
        // Broadcast new order alert
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", created.getId());
        payload.put("message", "신규 주문이 접수되었습니다: " + created.getDesign() + " (" + created.getOrderType() + ")");
        messagingTemplate.convertAndSend("/topic/process-alerts", (Object) payload);
        
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{orderId}/invoice")
    public ResponseEntity<InvoiceResponseDTO> getInvoice(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceCalculationService.calculateInvoice(orderId));
    }

    @PostMapping("/{orderId}/hold")
    public ResponseEntity<Map<String, Object>> putOrderOnHold(@PathVariable Long orderId) {
        orderService.setOrderHoldStatus(orderId, true);
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", orderId);
        payload.put("message", "Order " + orderId + " placed on HOLD due to change request.");
        
        messagingTemplate.convertAndSend("/topic/process-alerts", (Object) payload);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/advance-stage")
    public ResponseEntity<Map<String, Object>> advanceStage(@PathVariable Long orderId) {
        Map<String, Object> res = orderService.advanceOrderStage(orderId);

        // Send alert
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", orderId);
        payload.put("message", "주문 #" + orderId + " 공정이 [" + res.get("newStage") + "] 단계로 이동했습니다.");
        messagingTemplate.convertAndSend("/topic/process-alerts", (Object) payload);

        return ResponseEntity.ok(res);
    }

    @GetMapping("/{orderId}/cancel-estimate")
    public ResponseEntity<Map<String, Object>> getCancelEstimate(@PathVariable Long orderId) {
        Double estimate = orderService.calculateCancelEstimate(orderId);
        return ResponseEntity.ok(Map.of("estimatedFee", estimate));
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(@PathVariable Long orderId) {
        Map<String, Object> res = orderService.cancelOrder(orderId);

        // Send alert
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", orderId);
        payload.put("message", "Order " + orderId + " CANCELLED. Fee: ₩" + res.get("cancellationFee"));
        messagingTemplate.convertAndSend("/topic/process-alerts", (Object) payload);

        return ResponseEntity.ok(res);
    }
}
