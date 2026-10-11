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
        
        String msg = "신규 주문이 생성되었습니다: " + productName + " (" + (created.getOrderType() != null ? created.getOrderType() : "B2C") + ")";
        String initStage = created.getStage() != null ? created.getStage() : "신규";
        EventNotification notif = new EventNotification(securityUtils.getCurrentUserId(), created.getId(), created.getOrderNo(), msg, initStage);
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
        String itemLabel = String.valueOf(res.getOrDefault("itemLabel", "#" + orderId));
        String orderNo = String.valueOf(res.getOrDefault("orderNo", "ORD-" + orderId));
        Boolean allFinished = Boolean.TRUE.equals(res.get("allFinished"));

        // 1. Individual item stage change notification
        String msg = "물건 " + itemLabel + " [" + newStage + "] 단계로 이동했습니다.";
        EventNotification notif = new EventNotification(securityUtils.getCurrentUserId(), orderId, orderNo, msg, newStage);
        EventNotification savedNotif = eventNotificationRepository.save(notif);
        messagingTemplate.convertAndSend("/topic/process-alerts", savedNotif);

        // 2. If all items in the order are completed, announce order completion
        if (allFinished) {
            String orderMsg = "주문 #" + orderId + " 완료되었습니다.";
            EventNotification orderNotif = new EventNotification(securityUtils.getCurrentUserId(), orderId, orderNo, orderMsg, "완료");
            EventNotification savedOrderNotif = eventNotificationRepository.save(orderNotif);
            messagingTemplate.convertAndSend("/topic/process-alerts", savedOrderNotif);
        }

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

    @PostMapping("/{orderId}/change-template/{templateId}")
    public ResponseEntity<OrderResponseDTO> changeTemplate(@PathVariable Long orderId, @PathVariable Long templateId) {
        OrderResponseDTO updated = orderService.changeOrderTemplate(orderId, templateId);
        String msg = "주문 #" + orderId + "의 공정 템플릿이 [" + updated.getTemplateName() + "]로 변경되었습니다.";
        EventNotification notif = new EventNotification(securityUtils.getCurrentUserId(), orderId, updated.getOrderNo(), msg, updated.getStage());
        EventNotification savedNotif = eventNotificationRepository.save(notif);
        messagingTemplate.convertAndSend("/topic/process-alerts", savedNotif);
        return ResponseEntity.ok(updated);
    }
}
