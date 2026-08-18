package com.minibig.karatflow.backend.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderChangeService {
    private final SimpMessagingTemplate messagingTemplate;

    public void requestOrderChange(Long workOrderId, String changeType, String newValue) {
        log.info("Requesting change for WorkOrder: {}, Type: {}, Value: {}", workOrderId, changeType, newValue);
        // 1. Check cutoff_stage interlock rules
        // 2. Put order on HOLD
        // 3. Send STOMP alert to connected clients
        messagingTemplate.convertAndSend("/topic/process-alerts", "HOLD Alert: Change requested on WorkOrder " + workOrderId);
    }
}
