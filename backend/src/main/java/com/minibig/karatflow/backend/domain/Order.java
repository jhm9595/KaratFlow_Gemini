package com.minibig.karatflow.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
    name = "orders",
    indexes = {
        @Index(name = "idx_orders_user_status", columnList = "user_id, status"),
        @Index(name = "idx_orders_created_at", columnList = "created_at"),
        @Index(name = "idx_orders_order_no", columnList = "order_no")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order extends BaseEntity {

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

    @Column(name = "final_consumer_price", precision = 15, scale = 2)
    private BigDecimal finalConsumerPrice;
    
    @Column(name = "completed_weight_g", precision = 15, scale = 4)
    private BigDecimal completedWeightG;
    
    @Column(name = "stone_weight_g", precision = 15, scale = 4)
    private BigDecimal stoneWeightG;
    
    @Column(name = "loss_rate_percent", precision = 8, scale = 4)
    private BigDecimal lossRatePercent;
    
    @Column(name = "base_labor_fee", precision = 15, scale = 2)
    private BigDecimal baseLaborFee;
    
    @Column(name = "stone_fee", precision = 15, scale = 2)
    private BigDecimal stoneFee;

    @Column(name = "cancellation_fee", precision = 15, scale = 2)
    private BigDecimal cancellationFee;

    @Column(name = "user_id")
    private Long userId;
}
