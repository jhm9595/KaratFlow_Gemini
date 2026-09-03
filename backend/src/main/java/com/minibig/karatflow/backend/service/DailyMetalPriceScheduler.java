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
import jakarta.annotation.PostConstruct;

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

    @Value("${gold.api.key:}")
    private String goldApiKey;

    @PostConstruct
    @Transactional
    public void initFetch() {
        if (dailyMetalPriceRepository.count() == 0) {
            log.info("DB is empty. Fetching historical gold prices...");
            fetchHistoricalPrices();
        } else {
            fetchDailyMetalPrice();
        }
    }

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
            log.warn("Failed to fetch price from API. Falling back to most recent price.");
            Optional<DailyMetalPrice> mostRecent = dailyMetalPriceRepository.findTop7ByMetalTypeOrderByPriceDateDesc("GOLD_24K").stream().findFirst();
            if (mostRecent.isPresent()) {
                DailyMetalPrice fallbackPrice = new DailyMetalPrice();
                fallbackPrice.setPriceDate(today);
                fallbackPrice.setMetalType("GOLD_24K");
                fallbackPrice.setPricePer375g(mostRecent.get().getPricePer375g());
                dailyMetalPriceRepository.save(fallbackPrice);
            }
        }
    }

    private void fetchHistoricalPrices() {
        if (goldApiKey == null || goldApiKey.trim().isEmpty()) {
            log.error("GOLD_API_KEY is not set in environment properties!");
            return;
        }

        try {
            // Fetch last 20 rows (approx 10 trading days for 2 products)
            String rawUri = "https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo?serviceKey=" + goldApiKey + "&resultType=json&numOfRows=20&pageNo=1";
            log.info("Calling Gold API for history...");
            
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
                                
                                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMdd");
                                
                                for (Map<String, Object> item : itemList) {
                                    // Only get the 1kg standard gold price
                                    if ("04020000".equals(String.valueOf(item.get("srtnCd")))) {
                                        String dateStr = String.valueOf(item.get("basDt"));
                                        LocalDate date = LocalDate.parse(dateStr, dtf);
                                        
                                        if (dailyMetalPriceRepository.findByPriceDateAndMetalType(date, "GOLD_24K").isEmpty()) {
                                            double clpr = Double.parseDouble(String.valueOf(item.get("clpr")));
                                            double price375 = Math.round(clpr * 3.75);
                                            
                                            DailyMetalPrice price = new DailyMetalPrice();
                                            price.setPriceDate(date);
                                            price.setMetalType("GOLD_24K");
                                            price.setPricePer375g(price375);
                                            dailyMetalPriceRepository.save(price);
                                            log.info("Saved historical price for {}: {} won", date, price375);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Historical API Call failed: {}", e.getMessage(), e);
        }
    }

    private double fetchPriceFromApi() {
        if (goldApiKey == null || goldApiKey.trim().isEmpty()) {
            return -1;
        }

        try {
            String rawUri = "https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo?serviceKey=" + goldApiKey + "&resultType=json&numOfRows=2&pageNo=1";
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
                                        String clprStr = String.valueOf(item.get("clpr"));
                                        double clpr = Double.parseDouble(clprStr); // Price per 1g
                                        return Math.round(clpr * 3.75);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return -1;
        } catch (Exception e) {
            log.error("API Call failed: {}", e.getMessage(), e);
            return -1;
        }
    }
}
