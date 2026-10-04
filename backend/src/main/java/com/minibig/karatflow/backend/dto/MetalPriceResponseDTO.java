package com.minibig.karatflow.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetalPriceResponseDTO {
    private String priceDate;    // Full ISO date e.g. "2026-10-04"
    private String date;         // Display date e.g. "10/04"
    private Double pricePerGram; // 원/g
    private Double pricePer375g; // 원/3.75g
    private Double price24k;     // 24K 한돈 기준
    private Double price18k;     // 18K 한돈 기준
    private Double price14k;     // 14K 한돈 기준
    private Double volume;       // 거래량
    private Double value;        // 거래대금
}
