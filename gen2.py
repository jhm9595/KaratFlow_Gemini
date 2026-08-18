import os

base_path = 'backend/src/main/java/com/minibig/karatflow/backend'
config_path = os.path.join(base_path, 'config')
service_path = os.path.join(base_path, 'service')

os.makedirs(config_path, exist_ok=True)
os.makedirs(service_path, exist_ok=True)

files = {
    os.path.join(config_path, 'WebSocketConfig.java'): '''package com.minibig.karatflow.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-alerts").setAllowedOriginPatterns("*").withSockJS();
    }
}
''',
    os.path.join(service_path, 'OrderChangeService.java'): '''package com.minibig.karatflow.backend.service;

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
''',
    os.path.join(service_path, 'CancellationService.java'): '''package com.minibig.karatflow.backend.service;

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
''',
    os.path.join(service_path, 'InvoiceService.java'): '''package com.minibig.karatflow.backend.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    public void generateInvoice(Long orderId) {
        log.info("Generating invoice for Order: {}", orderId);
        // Calculate pure gold, apply loss rate, multiply by daily metal price
        // Sum up base labor fee, subcontract labor fee, change fee, cancellation fee
    }
}
'''
}

for path, content in files.items():
    with open(path, 'w') as f:
        f.write(content)

print("Backend services and config created.")
