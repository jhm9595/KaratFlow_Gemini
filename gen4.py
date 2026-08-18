import os

backend_path = 'backend/src/main'
java_path = os.path.join(backend_path, 'java/com/minibig/karatflow/backend')
db_path = os.path.join(backend_path, 'resources/db/migration')

# Update build.gradle
with open('backend/build.gradle', 'r') as f:
    gradle = f.read()

if 'spring-boot-starter-webflux' not in gradle:
    gradle = gradle.replace(
        "implementation 'org.springframework.boot:spring-boot-starter-webmvc'",
        "implementation 'org.springframework.boot:spring-boot-starter-webmvc'\n\timplementation 'org.springframework.boot:spring-boot-starter-webflux'"
    )
    with open('backend/build.gradle', 'w') as f:
        f.write(gradle)

# V2 DDL
v2_sql = '''CREATE TABLE company_partnerships (
    partnership_id BIGSERIAL PRIMARY KEY,
    requester_company_id BIGINT REFERENCES companies(company_id),
    target_company_id BIGINT REFERENCES companies(company_id),
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'APPROVED', 'REJECTED'
    pin_code VARCHAR(6),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
'''
with open(os.path.join(db_path, 'V2__add_company_partnerships.sql'), 'w') as f:
    f.write(v2_sql)

# CompanyPartnership.java
partnership_entity = '''package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "company_partnerships")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CompanyPartnership {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "partnership_id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_company_id")
    private Company requesterCompany;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_company_id")
    private Company targetCompany;
    
    private String status;
    @Column(name = "pin_code")
    private String pinCode;
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
'''
with open(os.path.join(java_path, 'domain/CompanyPartnership.java'), 'w') as f:
    f.write(partnership_entity)

# BusinessVerificationService.java
biz_svc = '''package com.minibig.karatflow.backend.service;

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

    public BusinessVerificationService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://api.odcloud.kr/api/nts-businessman/v1").build();
    }

    public Mono<String> verifyBusiness(String bNo) {
        log.info("Verifying business number: {}", bNo);
        // Call external API
        return webClient.post()
            .uri(uriBuilder -> uriBuilder.path("/status").queryParam("serviceKey", apiKey).build())
            .bodyValue("{\\"b_no\\": [\\"" + bNo + "\\"]}")
            .retrieve()
            .bodyToMono(String.class);
    }
}
'''
with open(os.path.join(java_path, 'service/BusinessVerificationService.java'), 'w') as f:
    f.write(biz_svc)

# PartnershipService.java
partner_svc = '''package com.minibig.karatflow.backend.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartnershipService {
    
    public void generateHandshakeInvite(Long requesterId, Long targetId) {
        log.info("Generating PIN for {} to invite {}", requesterId, targetId);
        // Generate 6 digit PIN, save to company_partnerships with PENDING status
    }
    
    public void acceptHandshake(Long targetId, String pinCode) {
        log.info("Accepting handshake with PIN: {}", pinCode);
        // Validate PIN, set status to APPROVED
    }
}
'''
with open(os.path.join(java_path, 'service/PartnershipService.java'), 'w') as f:
    f.write(partner_svc)

print("V2 backend components created.")
