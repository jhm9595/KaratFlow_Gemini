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

    @Column(nullable = false)
    private Double pricePer375g; // 돈(3.75g)당 시세

    @Column(nullable = false)
    private String metalType; // e.g. "GOLD_24K", "GOLD_18K", "GOLD_14K"
}
