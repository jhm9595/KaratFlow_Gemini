package com.minibig.karatflow.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "daily_metal_prices")
@Getter @Setter
@NoArgsConstructor
public class DailyMetalPrice {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate priceDate;

    @Column(name = "price_per_gram", nullable = true)
    private Double pricePerGram; // 순금 1g 당 시세 (KRX raw 응답 원/g)

    @Column(name = "price_per_375g", nullable = true)
    private Double pricePer375g; // 순금 3.75g (한돈) 기준 시세

    @Column(nullable = false)
    private String metalType; // e.g. "GOLD_24K"

    @Column
    private Double tradingVolume; // 거래량 (ACC_TRDVOL)

    @Column
    private Double tradingValue; // 거래대금 (ACC_TRDVAL)

    public Double getEffectiveGramPrice() {
        if (pricePerGram != null && pricePerGram > 0) {
            return pricePerGram;
        }
        if (pricePer375g != null && pricePer375g > 0) {
            return pricePer375g / 3.75;
        }
        return 0.0;
    }

    public Double getEffective375gPrice() {
        if (pricePer375g != null && pricePer375g > 0) {
            return pricePer375g;
        }
        if (pricePerGram != null && pricePerGram > 0) {
            return (double) Math.round(pricePerGram * 3.75);
        }
        return 0.0;
    }
}
