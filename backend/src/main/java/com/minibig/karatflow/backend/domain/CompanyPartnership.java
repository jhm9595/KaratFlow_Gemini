package com.minibig.karatflow.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "company_partnerships",
    indexes = {
        @Index(name = "idx_partnership_pin_status", columnList = "pin_code, status")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CompanyPartnership extends BaseEntity {
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
}
