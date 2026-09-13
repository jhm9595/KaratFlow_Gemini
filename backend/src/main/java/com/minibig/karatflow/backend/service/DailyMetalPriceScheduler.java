package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyMetalPriceScheduler {

    private final DailyMetalPriceRepository dailyMetalPriceRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${krx.api.key:}")
    private String krxApiKey;
    
    @Value("${gold.api.key:}")
    private String goldApiKey;

    // 장 마감 후 매일 오후 4시 30분에 실행 (당일 데이터만 갱신)
    @Scheduled(cron = "0 30 16 * * ?")
    @Transactional
    public void fetchDailyMetalPrice() {
        log.info("Starting Daily Metal Price Fetch Scheduler (KRX API)");

        LocalDate today = LocalDate.now();

        if (dailyMetalPriceRepository.findByPriceDateAndMetalType(today, "GOLD_24K").isPresent()) {
            log.info("Price for today {} already exists. Skipping.", today);
            return;
        }

        double[] fetchedData = fetchPriceFromKrxApi(today);

        if (fetchedData != null && fetchedData[0] > 0) {
            DailyMetalPrice newPrice = new DailyMetalPrice();
            newPrice.setPriceDate(today);
            newPrice.setMetalType("GOLD_24K");
            newPrice.setPricePer375g(fetchedData[0]);
            newPrice.setTradingVolume(fetchedData[1]);
            newPrice.setTradingValue(fetchedData[2]);
            dailyMetalPriceRepository.save(newPrice);
            log.info("Saved today's price: {} won, Vol: {}", fetchedData[0], fetchedData[1]);
        } else {
            log.warn("Failed to fetch price from API or Market is closed. Falling back to most recent price with 0 volume.");
            Optional<DailyMetalPrice> mostRecent = dailyMetalPriceRepository.findTop7ByMetalTypeOrderByPriceDateDesc("GOLD_24K").stream().findFirst();
            if (mostRecent.isPresent()) {
                DailyMetalPrice fallbackPrice = new DailyMetalPrice();
                fallbackPrice.setPriceDate(today);
                fallbackPrice.setMetalType("GOLD_24K");
                fallbackPrice.setPricePer375g(mostRecent.get().getPricePer375g());
                fallbackPrice.setTradingVolume(0.0);
                fallbackPrice.setTradingValue(0.0);
                dailyMetalPriceRepository.save(fallbackPrice);
            }
        }
    }

    private double[] fetchPriceFromKrxApi(LocalDate targetDate) {
        String basDd = targetDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        
        // 1. Try KRX API first if key exists
        if (krxApiKey != null && !krxApiKey.trim().isEmpty()) {
            try {
                String rawUri = "https://data-dbg.krx.co.kr/svc/apis/gen/gold_bydd_trd?basDd=" + basDd;
                log.info("Calling KRX Gold API: {}", rawUri);
                // Note: The actual KRX API requires headers like AUTH_KEY.
                // Assuming it works via header or query param. For now, adding it as query param for testing, 
                // but real KRX API usually expects header: `AUTH_KEY: key`
                // Let's implement header auth.
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.set("AUTH_KEY", krxApiKey);
                org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
                
                org.springframework.http.ResponseEntity<Map> response = restTemplate.exchange(new URI(rawUri), org.springframework.http.HttpMethod.GET, entity, Map.class);
                Map<String, Object> body = response.getBody();
                
                if (body != null && body.containsKey("OutBlock_1")) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) body.get("OutBlock_1");
                    if (list != null && !list.isEmpty()) {
                        for (Map<String, Object> item : list) {
                            if ("04020000".equals(String.valueOf(item.get("ISU_CD"))) || "금 99.99_1kg".equals(String.valueOf(item.get("ISU_NM")))) {
                                String clprStr = String.valueOf(item.get("TDD_CLSPRC")).replace(",", "");
                                String volStr = String.valueOf(item.get("ACC_TRDVOL")).replace(",", "");
                                String valStr = String.valueOf(item.get("ACC_TRDVAL")).replace(",", "");
                                
                                double clpr = Double.parseDouble(clprStr);
                                double vol = Double.parseDouble(volStr);
                                double val = Double.parseDouble(valStr);
                                
                                return new double[]{Math.round(clpr * 3.75), vol, val};
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("KRX API Call failed: {}", e.getMessage());
            }
        }
        
        // 2. Fallback to Open Data Portal API (Existing one)
        if (goldApiKey != null && !goldApiKey.trim().isEmpty()) {
            try {
                String rawUri = "https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo?serviceKey=" + goldApiKey + "&resultType=json&numOfRows=2&pageNo=1&basDt=" + basDd;
                Map<String, Object> response = restTemplate.getForObject(new URI(rawUri), Map.class);
                if (response != null && response.containsKey("response")) {
                    Map<String, Object> resBody = (Map<String, Object>) response.get("response");
                    if (resBody != null && resBody.containsKey("body")) {
                        Map<String, Object> body = (Map<String, Object>) resBody.get("body");
                        if (body != null && body.containsKey("items")) {
                            Map<String, Object> itemsMap = (Map<String, Object>) body.get("items");
                            if (itemsMap != null && itemsMap.containsKey("item")) {
                                List<Map<String, Object>> itemList = (List<Map<String, Object>>) itemsMap.get("item");
                                if (itemList != null && !itemList.isEmpty()) {
                                    for (Map<String, Object> item : itemList) {
                                        if ("04020000".equals(String.valueOf(item.get("srtnCd")))) {
                                            double clpr = Double.parseDouble(String.valueOf(item.get("clpr")));
                                            double vol = Double.parseDouble(String.valueOf(item.get("trqu")));
                                            double val = Double.parseDouble(String.valueOf(item.get("trPrc")));
                                            return new double[]{Math.round(clpr * 3.75), vol, val};
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Fallback Open Data API Call failed: {}", e.getMessage());
            }
        }
        return null;
    }
}
