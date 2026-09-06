package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class DebugController {

    private final DailyMetalPriceRepository repository;

    @GetMapping("/api/debug/clear-gold")
    public String clearGold() {
        repository.deleteAll();
        return "Cleared daily_metal_price. Restart backend to fetch fresh.";
    }
}
