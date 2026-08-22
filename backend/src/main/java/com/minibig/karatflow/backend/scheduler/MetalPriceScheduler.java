package com.minibig.karatflow.backend.scheduler;

import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Random;

@Slf4j
@Component
@RequiredArgsConstructor
public class MetalPriceScheduler {

    private final DailyMetalPriceRepository dailyMetalPriceRepository;
    private final Random random = new Random();

    // Runs every day at 10:30 AM (mock schedule, for demo we can also run at startup or every hour)
    // Here we use a cron expression: sec min hour day month year
    @Scheduled(cron = "0 30 10 * * ?")
    public void fetchDailyMetalPrice() {
        log.info("Fetching daily metal price from API (Mock)");
        
        LocalDate today = LocalDate.now();
        String metalType = "GOLD_24K";
        
        dailyMetalPriceRepository.findByPriceDateAndMetalType(today, metalType).ifPresentOrElse(
            price -> log.info("Metal price for today already exists: {}", price.getPricePer375g()),
            () -> {
                DailyMetalPrice newPrice = new DailyMetalPrice();
                newPrice.setPriceDate(today);
                newPrice.setMetalType(metalType);
                // Mock price between 380,000 and 420,000 KRW
                double mockPrice = 380000 + (40000 * random.nextDouble());
                newPrice.setPricePer375g((double) Math.round(mockPrice));
                
                dailyMetalPriceRepository.save(newPrice);
                log.info("Saved new daily metal price for {}: {}", today, newPrice.getPricePer375g());
            }
        );
    }
}
