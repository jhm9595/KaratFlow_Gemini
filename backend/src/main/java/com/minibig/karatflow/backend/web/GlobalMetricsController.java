package com.minibig.karatflow.backend.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import com.minibig.karatflow.backend.repository.DailyPetroleumPriceRepository;
import com.minibig.karatflow.backend.repository.DailyKospiPriceRepository;
import lombok.RequiredArgsConstructor;
import java.time.LocalDate;


@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/global-metrics")
public class GlobalMetricsController {

    private final RestTemplate restTemplate = new RestTemplate();

    private final DailyPetroleumPriceRepository petroleumRepo;
    private final DailyKospiPriceRepository kospiRepo;



    @GetMapping("/petroleum/history")
    public ResponseEntity<List<com.minibig.karatflow.backend.domain.DailyPetroleumPrice>> getPetroleumHistory() {
                List<com.minibig.karatflow.backend.domain.DailyPetroleumPrice> all = petroleumRepo.findAllByOrderByDateAsc();
        double lastGas = 0, lastDie = 0, lastKer = 0;
        for (com.minibig.karatflow.backend.domain.DailyPetroleumPrice p : all) {
            if (p.getGasolinePrice() != null && p.getGasolinePrice() > 0) lastGas = p.getGasolinePrice();
            else p.setGasolinePrice(lastGas);
            
            if (p.getDieselPrice() != null && p.getDieselPrice() > 0) lastDie = p.getDieselPrice();
            else p.setDieselPrice(lastDie);
            
            if (p.getKerosenePrice() != null && p.getKerosenePrice() > 0) lastKer = p.getKerosenePrice();
            else p.setKerosenePrice(lastKer);
        }
        List<com.minibig.karatflow.backend.domain.DailyPetroleumPrice> recent = all.size() > 7 ? all.subList(all.size() - 7, all.size()) : all;
        return ResponseEntity.ok(recent);
    }

    @GetMapping("/kospi/history")
    public ResponseEntity<List<com.minibig.karatflow.backend.domain.DailyKospiPrice>> getKospiHistory() {
                List<com.minibig.karatflow.backend.domain.DailyKospiPrice> all = kospiRepo.findAllByOrderByDateAsc();
        double lastKospi = 0, lastKospi200 = 0;
        for (com.minibig.karatflow.backend.domain.DailyKospiPrice k : all) {
            if (k.getKospiIndex() != null && k.getKospiIndex() > 0) lastKospi = k.getKospiIndex();
            else k.setKospiIndex(lastKospi);
            
            if (k.getKospi200Index() != null && k.getKospi200Index() > 0) lastKospi200 = k.getKospi200Index();
            else k.setKospi200Index(lastKospi200);
        }
        List<com.minibig.karatflow.backend.domain.DailyKospiPrice> recent = all.size() > 7 ? all.subList(all.size() - 7, all.size()) : all;
        return ResponseEntity.ok(recent);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getGlobalMetrics() {
        Map<String, Object> result = new HashMap<>();
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        String[] symbols = {"PL=F", "HG=F", "DX-Y.NYB"};
        String[] keys = {"platinum", "copper", "dxy"};

        for (int i = 0; i < symbols.length; i++) {
            try {
                String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbols[i];
                ResponseEntity<Map> response = restTemplate.exchange(new URI(url), HttpMethod.GET, entity, Map.class);
                
                if (response.getBody() != null) {
                    Map<String, Object> chart = (Map<String, Object>) response.getBody().get("chart");
                    List<Object> resultList = (List<Object>) chart.get("result");
                    if (resultList != null && !resultList.isEmpty()) {
                        Map<String, Object> resObj = (Map<String, Object>) resultList.get(0);
                        Map<String, Object> meta = (Map<String, Object>) resObj.get("meta");
                        
                        double price = Double.parseDouble(String.valueOf(meta.get("regularMarketPrice")));
                        double prevClose = Double.parseDouble(String.valueOf(meta.get("chartPreviousClose")));
                        double change = price - prevClose;
                        double changePercent = (change / prevClose) * 100;
                        
                        Map<String, Object> metrics = new HashMap<>();
                        metrics.put("price", price);
                        metrics.put("change", change);
                        metrics.put("changePercent", changePercent);
                        
                        result.put(keys[i], metrics);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to fetch yahoo finance for {}", symbols[i], e);
            }
        }

        
        // Fetch DB data (Latest available)
        petroleumRepo.findAllByOrderByDateAsc().stream().reduce((first, second) -> second).ifPresent(p -> {
            Map<String, Object> pMap = new HashMap<>();
            pMap.put("date", p.getDate());
            pMap.put("gasoline", p.getGasolinePrice());
            pMap.put("diesel", p.getDieselPrice());
            pMap.put("kerosene", p.getKerosenePrice());
            result.put("petroleum", pMap);
        });
        
        kospiRepo.findAllByOrderByDateAsc().stream().reduce((first, second) -> second).ifPresent(k -> {
            Map<String, Object> kMap = new HashMap<>();
            kMap.put("date", k.getDate());
            kMap.put("kospi", k.getKospiIndex());
            kMap.put("kospi200", k.getKospi200Index());
            kMap.put("tradingValue", k.getTradingValue());
            result.put("kospi", kMap);
        });

        return ResponseEntity.ok(result);
    }
}
