package com.minibig.karatflow.backend.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CancellationService {

    public void cancelWorkOrder(Long workOrderId, String currentStage) {
        log.info("Cancelling WorkOrder: {}, Stage: {}", workOrderId, currentStage);
        // Stage-based cancellation fee logic
        // Calculate scrap gold and deduct from inventory
    }
}
