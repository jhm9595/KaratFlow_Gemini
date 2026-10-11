package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.EventNotification;
import com.minibig.karatflow.backend.dto.InvoiceResponseDTO;
import com.minibig.karatflow.backend.dto.OrderResponseDTO;
import com.minibig.karatflow.backend.repository.EventNotificationRepository;
import com.minibig.karatflow.backend.service.InvoiceCalculationService;
import com.minibig.karatflow.backend.service.OrderService;
import com.minibig.karatflow.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    
    private final OrderService orderService;
    private final SimpMessagingTemplate messagingTemplate;
    private final InvoiceCalculationService invoiceCalculationService;
    private final EventNotificationRepository eventNotificationRepository;
    private final SecurityUtils securityUtils;

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
        
        String productName = created.getDesign();
        if (productName == null || productName.trim().isEmpty()) {
            productName = created.getUnmappedProductName();
        }
        if (productName == null || productName.trim().isEmpty()) {
            productName = created.getOrderNo();
        }
        
        String msg = "신규 주문이 접수되었습니다: " + productName + " (" + (created.getOrderType() != null ? created.getOrderType() : "B2C") + ")";
        EventNotification notif = new EventNotification(securityUtils.getCurrentUserId(), created.getId(), created.getOrderNo(), msg, "접수");
        EventNotification savedNotif = eventNotificationRepository.save(notif);

        messagingTemplate.convertAndSend("/topic/process-alerts", savedNotif);
        
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{orderId}/invoice")
    public ResponseEntity<InvoiceResponseDTO> getInvoice(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceCalculationService.calculateInvoice(orderId));
    }

    @GetMapping("/{orderId}/details")
    public ResponseEntity<com.minibig.karatflow.backend.domain.OrderDetailDTO> getOrderDetails(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderDetails(orderId));
    }

    @PostMapping("/{orderId}/hold")
    public ResponseEntity<Map<String, Object>> putOrderOnHold(@PathVariable Long orderId) {
        orderService.setOrderHoldStatus(orderId, true);
        
        String msg = "주문 #" + orderId + "건이 고객 요청으로 보류(HOLD) 상태가 되었습니다.";
        EventNotification notif = new EventNotification(securityUtils.getCurrentUserId(), orderId, "KF-" + orderId, msg, "보류");
        EventNotification savedNotif = eventNotificationRepository.save(notif);
        
        messagingTemplate.convertAndSend("/topic/process-alerts", savedNotif);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/advance-stage")
    public ResponseEntity<Map<String, Object>> advanceStage(@PathVariable Long orderId) {
        Map<String, Object> res = orderService.advanceOrderStage(orderId);
        String newStage = String.valueOf(res.getOrDefault("newStage", "진행"));

        String msg = "주문 #" + orderId + " 공정이 [" + newStage + "] 단계로 이동했습니다.";
        EventNotification notif = new EventNotification(securityUtils.getCurrentUserId(), orderId, "KF-" + orderId, msg, newStage);
        EventNotification savedNotif = eventNotificationRepository.save(notif);

        messagingTemplate.convertAndSend("/topic/process-alerts", savedNotif);

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

        String msg = "주문 #" + orderId + "건이 취소되었습니다. 취소 수수료: " + res.get("cancellationFee");
        EventNotification notif = new EventNotification(securityUtils.getCurrentUserId(), orderId, "KF-" + orderId, msg, "취소");
        EventNotification savedNotif = eventNotificationRepository.save(notif);

        messagingTemplate.convertAndSend("/topic/process-alerts", savedNotif);

        return ResponseEntity.ok(res);
    }
}
