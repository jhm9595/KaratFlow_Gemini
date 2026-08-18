package com.minibig.karatflow.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class BusinessVerificationService {
    private final WebClient webClient;
    
    @Value("")
    private String apiKey;

    public BusinessVerificationService() {
        this.webClient = WebClient.create("https://api.odcloud.kr/api/nts-businessman/v1");
    }

    public Mono<String> verifyBusiness(String bNo) {
        log.info("Verifying business number: {}", bNo);
        // Call external API
        return webClient.post()
            .uri(uriBuilder -> uriBuilder.path("/status").queryParam("serviceKey", apiKey).build())
            .bodyValue("{\"b_no\": [\"" + bNo + "\"]}")
            .retrieve()
            .bodyToMono(String.class);
    }
}
