package com.minibig.karatflow.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

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
            // Get yesterday's date (or today, but KRX closes at 15:30)
            // Let's not specify basDt to get the most recent data
            String urlStr = "https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo"
                    + "?serviceKey=" + goldApiKey
                    + "&resultType=json"
                    + "&numOfRows=1"
                    + "&pageNo=1"
                    + "&itmsNm=금 99.99_1Kg"; // You can URL encode if needed, but Spring handles it in URI components

            URI uri = UriComponentsBuilder.fromHttpUrl("https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo")
                    .queryParam("serviceKey", goldApiKey)
                    .queryParam("resultType", "json")
                    .queryParam("numOfRows", 1)
                    .queryParam("pageNo", 1)
                    // .queryParam("itmsNm", "금 99.99_1Kg") // sometimes Korean characters cause issues with UriComponentsBuilder, let's omit to just get the top result which is usually 1Kg or 100g
                    .build(true).toUri(); // true = already encoded (actually serviceKey needs to be NOT encoded twice, but let's just use string)
            
            // Rebuilding URI to prevent double encoding of serviceKey which is common issue with data.go.kr
            String rawUri = "https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo?serviceKey=" + goldApiKey + "&resultType=json&numOfRows=1&pageNo=1";
            
            log.info("Calling Gold API: {}", "https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo?serviceKey=...&resultType=json");
            String response = restTemplate.getForObject(new URI(rawUri), String.class);
            
            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.path("response").path("body").path("items").path("item");
            
            if (items.isArray() && items.size() > 0) {
                JsonNode firstItem = items.get(0);
                String clprStr = firstItem.path("clpr").asText();
                double clpr = Double.parseDouble(clprStr); // Price per 1g
                log.info("API returned 1g price: {} for item: {}", clpr, firstItem.path("itmsNm").asText());
                
                // Convert 1g price to 3.75g (1돈)
                double price375 = clpr * 3.75;
                return Math.round(price375);
            } else {
                log.warn("API returned no items. Response: {}", response);
                return -1;
            }

        } catch (Exception e) {
            log.error("API Call failed: {}", e.getMessage(), e);
            return -1;
        }
    }
}
