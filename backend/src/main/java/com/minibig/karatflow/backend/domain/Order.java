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
    
    @Column(name = "order_no", unique = true)
    private String orderNo;
    
    @Column(name = "short_code", unique = true, length = 8)
    private String shortCode;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_company_id")
    private Company vendorCompany;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturer_company_id")
    private Company manufacturerCompany;
    
    @Column(name = "order_date")
    private LocalDate orderDate;
    private String status;
    @Column(name = "order_type")
    private String orderType;
    @Column(name = "customer_name")
    private String customerName;
    @Column(name = "customer_phone")
    private String customerPhone;
    @Column(name = "final_consumer_price")
    private java.math.BigDecimal finalConsumerPrice;
    
    @Column(name = "completed_weight_g")
    private Double completedWeightG;
    
    @Column(name = "stone_weight_g")
    private Double stoneWeightG;
    
    @Column(name = "loss_rate_percent")
    private Double lossRatePercent;
    
    @Column(name = "base_labor_fee")
    private Double baseLaborFee;
    
    @Column(name = "stone_fee")
    private Double stoneFee;

    @Column(name = "cancellation_fee")
    private Double cancellationFee;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
