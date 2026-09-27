package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import com.minibig.karatflow.backend.service.KrxMarketDataSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/metal-prices")
@RequiredArgsConstructor
public class MetalPriceController {

    private final DailyMetalPriceRepository dailyMetalPriceRepository;
    private final KrxMarketDataSyncService krxMarketDataSyncService;

    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentPrices() {
        // Trigger non-blocking async catch-up sync if today's data is missing in DB
        krxMarketDataSyncService.triggerSyncIfNecessary();

        List<DailyMetalPrice> all = dailyMetalPriceRepository.findAllByMetalTypeOrderByPriceDateAsc("GOLD_24K");
        
        List<Map<String, Object>> calculatedList = new ArrayList<>();
        double runningGram = 107645.0; // Fallback g-unit price
        double runningVol = 215000.0;
        double runningVal = 41000000000.0;

        for (DailyMetalPrice p : all) {
            double gram = p.getEffectiveGramPrice();
            if (gram <= 0) {
                gram = p.getEffective375gPrice() > 0 ? (p.getEffective375gPrice() / 3.75) : runningGram;
            } else {
                runningGram = gram;
            }

            if (p.getTradingVolume() != null && p.getTradingVolume() > 0) runningVol = p.getTradingVolume();
            if (p.getTradingValue() != null && p.getTradingValue() > 0) runningVal = p.getTradingValue();

            double p24 = Math.round(gram * 3.75);
            double p18 = Math.round((p24 * 0.825) / 100) * 100;
            double p14 = Math.round((p24 * 0.6435) / 100) * 100;

            Map<String, Object> map = new HashMap<>();
            map.put("date", p.getPriceDate().format(DateTimeFormatter.ofPattern("MM/dd")));
            map.put("pricePerGram", Math.round(gram * 10.0) / 10.0);
            map.put("price24k", p24);
            map.put("price18k", p18);
            map.put("price14k", p14);
            map.put("volume", runningVol);
            map.put("value", runningVal);

            calculatedList.add(map);
        }

        List<Map<String, Object>> response = calculatedList.size() > 7 
                ? calculatedList.subList(calculatedList.size() - 7, calculatedList.size()) 
                : calculatedList;

        return ResponseEntity.ok(response);
    }
}
