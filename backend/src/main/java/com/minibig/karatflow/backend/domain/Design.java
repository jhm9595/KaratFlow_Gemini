package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "designs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Design {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "design_id")
    private Long id;
    
    @Column(name = "design_code")
    private String designCode;
    
    private String name;
    
    @Column(name = "base_labor_fee")
    private java.math.BigDecimal baseLaborFee;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
