package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
                List<DailyMetalPrice> all = dailyMetalPriceRepository.findAllByMetalTypeOrderByPriceDateAsc("GOLD_24K");
        double lastPrice = 0, lastVol = 0, lastVal = 0;
        for (DailyMetalPrice p : all) {
            if (p.getPricePer375g() != null && p.getPricePer375g() > 0) lastPrice = p.getPricePer375g();
            else p.setPricePer375g(lastPrice);
            
            if (p.getTradingVolume() != null && p.getTradingVolume() > 0) lastVol = p.getTradingVolume();
            else p.setTradingVolume(lastVol);
            
            if (p.getTradingValue() != null && p.getTradingValue() > 0) lastVal = p.getTradingValue();
            else p.setTradingValue(lastVal);
        }
        List<DailyMetalPrice> recent = all.size() > 7 ? all.subList(all.size() - 7, all.size()) : all;
        
        List<Map<String, Object>> response = recent.stream()
                
                .map(price -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("date", price.getPriceDate().format(DateTimeFormatter.ofPattern("MM/dd")));
                    
                    double p24 = price.getPricePer375g();
                    double p18 = Math.round((p24 * 0.825) / 100) * 100;
                    double p14 = Math.round((p24 * 0.6435) / 100) * 100;

                    map.put("price24k", p24);
                    map.put("price18k", p18);
                    map.put("price14k", p14);
                    
                    map.put("volume", price.getTradingVolume() != null ? price.getTradingVolume() : 0.0);
                    map.put("value", price.getTradingValue() != null ? price.getTradingValue() : 0.0);
                    
                    return map;
                })
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(response);
    }
}
