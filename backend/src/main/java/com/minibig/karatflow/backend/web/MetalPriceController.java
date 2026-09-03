package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/metal-prices")
@RequiredArgsConstructor
public class MetalPriceController {

    private final DailyMetalPriceRepository dailyMetalPriceRepository;

    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentPrices() {
        // Fetch the 7 most recent prices, order by date desc, then reverse to asc for the chart
        List<DailyMetalPrice> recent = dailyMetalPriceRepository.findTop7ByMetalTypeOrderByPriceDateDesc("GOLD_24K");
        
        List<Map<String, Object>> response = recent.stream()
                .sorted((a, b) -> a.getPriceDate().compareTo(b.getPriceDate())) // Ascending order
                .map(price -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("date", price.getPriceDate().format(DateTimeFormatter.ofPattern("MM/dd")));
                    
                    double p24 = price.getPricePer375g();
                    double p18 = Math.round((p24 * 0.825) / 100) * 100;
                    double p14 = Math.round((p24 * 0.6435) / 100) * 100;

                    map.put("price24k", p24);
                    map.put("price18k", p18);
                    map.put("price14k", p14);
                    return map;
                })
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(response);
    }
}
