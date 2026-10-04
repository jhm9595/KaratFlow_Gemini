package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.EventNotification;
import com.minibig.karatflow.backend.dto.OrderResponseDTO;
import com.minibig.karatflow.backend.repository.EventNotificationRepository;
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

    @PostMapping("/{workOrderId}/advance-stage")
    public ResponseEntity<OrderResponseDTO> advanceWorkOrderStage(@PathVariable Long workOrderId) {
        OrderResponseDTO updatedOrder = orderService.advanceStage(workOrderId);

        String newStage = updatedOrder.getStage();
        String msg = "작업지시서 #" + workOrderId + " 공정이 [" + newStage + "] 단계로 이동했습니다.";
        EventNotification notif = new EventNotification(updatedOrder.getId(), updatedOrder.getOrderNo(), msg, newStage);
        EventNotification savedNotif = eventNotificationRepository.save(notif);

        messagingTemplate.convertAndSend("/topic/process-alerts", savedNotif);

        return ResponseEntity.ok(updatedOrder);
    }
}
