package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_company_id")
    private Company vendorCompany;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturer_company_id")
    private Company manufacturerCompany;
    @Column(name = "order_date")
    private LocalDate orderDate;
    private String status;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
