package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyMetalPriceScheduler {

    private final DailyMetalPriceRepository dailyMetalPriceRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Executes every day at 10:30 AM (cron = "0 30 10 * * ?")
     * To test every minute, uncomment the second line.
     */
    @Scheduled(cron = "0 30 10 * * ?")
    // @Scheduled(cron = "0 * * * * ?")
    @Transactional
    public void fetchDailyMetalPrice() {
        log.info("Starting Daily Metal Price Fetch Scheduler");

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
                // Hardcoded fallback if absolutely needed
                DailyMetalPrice defaultPrice = new DailyMetalPrice();
                defaultPrice.setPriceDate(today);
                defaultPrice.setMetalType("GOLD_24K");
                defaultPrice.setPricePer375g(400000.0);
                dailyMetalPriceRepository.save(defaultPrice);
            }
        }
    }

    private double fetchPriceFromApi() {
        try {
            // In a real scenario, this would call KRX or Data.go.kr API
            // For now, we simulate a network call that returns a valid price 
            // 80% of the time, and fails 20% of the time to test fallback.
            if (Math.random() > 0.8) {
                throw new RuntimeException("Simulated API failure (e.g. timeout or holiday)");
            }
            
            // Generate a random gold price around 400,000 to 450,000 KRW
            double simulatedPrice = 400000.0 + (Math.random() * 50000.0);
            return Math.round(simulatedPrice / 1000) * 1000; // Round to nearest 1000

        } catch (Exception e) {
            log.error("API Call failed: {}", e.getMessage());
            return -1;
        }
    }
}
