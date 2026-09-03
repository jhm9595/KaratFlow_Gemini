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
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyMetalPriceScheduler {

    private final DailyMetalPriceRepository dailyMetalPriceRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    

    @Value("${gold.api.key:}")
    private String goldApiKey;

    /**
     * Executes every day at 10:30 AM (cron = "0 30 10 * * ?")
     */
    @Scheduled(cron = "0 30 10 * * ?")
    @Transactional
    public void fetchDailyMetalPrice() {
        log.info("Starting Daily Metal Price Fetch Scheduler (Real API)");

        LocalDate today = LocalDate.now();

        // Check if price already exists for today
        if (dailyMetalPriceRepository.findByPriceDateAndMetalType(today, "GOLD_24K").isPresent()) {
            log.info("Price for today {} already exists. Skipping.", today);
            return;
        }

        double priceFetched = fetchPriceFromApi();

        if (priceFetched > 0) {
            DailyMetalPrice newPrice = new DailyMetalPrice();
            newPrice.setPriceDate(today);
            newPrice.setMetalType("GOLD_24K");
            newPrice.setPricePer375g(priceFetched);
            dailyMetalPriceRepository.save(newPrice);
            log.info("Saved today's price: {} won", priceFetched);
        } else {
            // Fallback: Copy most recent price
            log.warn("Failed to fetch price from API. Falling back to most recent price.");
            Optional<DailyMetalPrice> mostRecent = dailyMetalPriceRepository.findFirstByMetalTypeOrderByPriceDateDesc("GOLD_24K");
            
            if (mostRecent.isPresent()) {
                DailyMetalPrice fallbackPrice = new DailyMetalPrice();
                fallbackPrice.setPriceDate(today);
                fallbackPrice.setMetalType("GOLD_24K");
                fallbackPrice.setPricePer375g(mostRecent.get().getPricePer375g());
                dailyMetalPriceRepository.save(fallbackPrice);
                log.info("Saved fallback price: {} won (original date: {})", fallbackPrice.getPricePer375g(), mostRecent.get().getPriceDate());
            } else {
                log.error("No fallback price available! Database is empty.");
            }
        }
    }

    private double fetchPriceFromApi() {
        if (goldApiKey == null || goldApiKey.trim().isEmpty()) {
            log.error("GOLD_API_KEY is not set in environment properties!");
            return -1;
        }

        try {
            String rawUri = "https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo?serviceKey=" + goldApiKey + "&resultType=json&numOfRows=1&pageNo=1";
            log.info("Calling Gold API...");
            
            java.util.Map<String, Object> response = restTemplate.getForObject(new java.net.URI(rawUri), java.util.Map.class);
            
            if (response != null && response.containsKey("response")) {
                java.util.Map<String, Object> resBody = (java.util.Map<String, Object>) response.get("response");
                if (resBody != null && resBody.containsKey("body")) {
                    java.util.Map<String, Object> body = (java.util.Map<String, Object>) resBody.get("body");
                    if (body != null && body.containsKey("items")) {
                        java.util.Map<String, Object> itemsMap = (java.util.Map<String, Object>) body.get("items");
                        if (itemsMap != null && itemsMap.containsKey("item")) {
                            java.util.List<java.util.Map<String, Object>> itemList = (java.util.List<java.util.Map<String, Object>>) itemsMap.get("item");
                            if (itemList != null && !itemList.isEmpty()) {
                                java.util.Map<String, Object> firstItem = itemList.get(0);
                                String clprStr = String.valueOf(firstItem.get("clpr"));
                                double clpr = Double.parseDouble(clprStr); // Price per 1g
                                log.info("API returned 1g price: {} for item: {}", clpr, firstItem.get("itmsNm"));
                                
                                // Convert 1g price to 3.75g (1돈)
                                double price375 = clpr * 3.75;
                                return Math.round(price375);
                            }
                        }
                    }
                }
            }
            log.warn("API returned invalid or empty response structure");
            return -1;

        } catch (Exception e) {
            log.error("API Call failed: {}", e.getMessage(), e);
            return -1;
        }
    }
}
