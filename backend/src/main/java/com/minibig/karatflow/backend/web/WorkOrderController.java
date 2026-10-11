package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.EventNotification;
import com.minibig.karatflow.backend.dto.OrderResponseDTO;
import com.minibig.karatflow.backend.repository.EventNotificationRepository;
import com.minibig.karatflow.backend.security.SecurityUtils;
import com.minibig.karatflow.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/work-orders")
@RequiredArgsConstructor
public class WorkOrderController {

    private final OrderService orderService;
    private final SimpMessagingTemplate messagingTemplate;
    private final EventNotificationRepository eventNotificationRepository;
    private final SecurityUtils securityUtils;

    @PostMapping("/{workOrderId}/advance-stage")
    public ResponseEntity<OrderResponseDTO> advanceWorkOrderStage(@PathVariable Long workOrderId) {
        OrderResponseDTO updatedOrder = orderService.advanceStage(workOrderId);

        String itemStage = updatedOrder.getItemStage() != null ? updatedOrder.getItemStage() : updatedOrder.getStage();
        String itemLabel = updatedOrder.getItemLabel() != null ? updatedOrder.getItemLabel() : ("#" + updatedOrder.getId());

        // 1. Individual item stage change notification
        String msg = "물건 " + itemLabel + " [" + itemStage + "] 단계로 이동했습니다.";
        EventNotification notif = new EventNotification(securityUtils.getCurrentUserId(), updatedOrder.getId(), updatedOrder.getOrderNo(), msg, itemStage);
        EventNotification savedNotif = eventNotificationRepository.save(notif);
        messagingTemplate.convertAndSend("/topic/process-alerts", savedNotif);

        // 2. If all items in the order are completed, announce order completion
        if (Boolean.TRUE.equals(updatedOrder.getAllFinished())) {
            String orderMsg = "주문 #" + updatedOrder.getId() + " 완료되었습니다.";
            EventNotification orderNotif = new EventNotification(securityUtils.getCurrentUserId(), updatedOrder.getId(), updatedOrder.getOrderNo(), orderMsg, "완료");
            EventNotification savedOrderNotif = eventNotificationRepository.save(orderNotif);
            messagingTemplate.convertAndSend("/topic/process-alerts", savedOrderNotif);
        }

        return ResponseEntity.ok(updatedOrder);
    }
}
