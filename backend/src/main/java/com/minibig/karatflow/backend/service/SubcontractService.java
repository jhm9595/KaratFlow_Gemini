package com.minibig.karatflow.backend.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubcontractService {

    @Transactional
    public void trackWeightAndCalculateLoss(Long taskId, Double dispatchedWeight, Double receivedWeight) {
        log.info("Tracking weight for Task: {}, Dispatched: {}, Received: {}", taskId, dispatchedWeight, receivedWeight);
        // TODO: Implement actual loss calculation based on received weight vs dispatched weight
        // and update the SubcontractTask entity.
    }
}
