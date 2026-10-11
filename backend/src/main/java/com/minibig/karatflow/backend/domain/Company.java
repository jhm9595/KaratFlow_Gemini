package com.minibig.karatflow.backend.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "companies",
    indexes = {
        @Index(name = "idx_companies_role", columnList = "role")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Long id;
    
    private String name;
    
    private String role;
}
