package com.minibig.karatflow.backend.domain;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "design_id")
    private Design design;
    
    private Integer quantity;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(name = "unmapped_product_name")
    private String unmappedProductName;
    
    @Column(name = "unmapped_brand_name")
    private String unmappedBrandName;
    
    @Column(name = "engraving_text")
    private String engravingText;
    
    @Column(name = "engraving_font")
    private String engravingFont;
    
    @Column(name = "engraving_location")
    private String engravingLocation;
    
    @Column(name = "surface_finish")
    private String surfaceFinish;
    
    private String status;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
