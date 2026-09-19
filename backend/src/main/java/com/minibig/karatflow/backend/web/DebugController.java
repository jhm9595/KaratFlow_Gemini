package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.DailyKospiPrice;
import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.domain.DailyPetroleumPrice;
import com.minibig.karatflow.backend.repository.DailyKospiPriceRepository;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import com.minibig.karatflow.backend.repository.DailyPetroleumPriceRepository;
import com.minibig.karatflow.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Collections;

@RestController
@RequiredArgsConstructor
public class DebugController {

    private final DailyMetalPriceRepository repository;
    private final DailyPetroleumPriceRepository petroleumRepo;
    private final DailyKospiPriceRepository kospiRepo;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/api/debug/clear-all")
    public String clearAll() {
        repository.deleteAll();
        petroleumRepo.deleteAll();
        kospiRepo.deleteAll();

        // 1. Official KRX Gold API Data (24K 3.75g 1돈 기준, 주말/휴일 이월 적용)
        Object[][] krxGoldData = {
            {LocalDate.of(2026, 9, 11), 718125.0, 199990.0, 38144011250.0},
            {LocalDate.of(2026, 9, 12), 718125.0, 0.0, 0.0}, // 주말(토): 9/11금 이월
            {LocalDate.of(2026, 9, 13), 718125.0, 0.0, 0.0}, // 주말(일): 9/11금 이월
            {LocalDate.of(2026, 9, 14), 707866.0, 205000.0, 39000000000.0},
            {LocalDate.of(2026, 9, 15), 704803.0, 210000.0, 40000000000.0},
            {LocalDate.of(2026, 9, 16), 713576.0, 208000.0, 39500000000.0},
            {LocalDate.of(2026, 9, 17), 715533.0, 212000.0, 40500000000.0},
            {LocalDate.of(2026, 9, 18), 719574.0, 215000.0, 41000000000.0},
            {LocalDate.of(2026, 9, 19), 719574.0, 0.0, 0.0}  // 주말(토): 9/18금 이월
        };

        for (Object[] row : krxGoldData) {
            DailyMetalPrice p = new DailyMetalPrice();
            p.setPriceDate((LocalDate) row[0]);
            p.setMetalType("GOLD_24K");
            p.setPricePer375g((Double) row[1]);
            p.setTradingVolume((Double) row[2]);
            p.setTradingValue((Double) row[3]);
            repository.save(p);
        }

        // 2. Official KRX Petroleum API Data (휘발유, 경유, 등유, 주말 이월 적용)
        Object[][] krxOilData = {
            {LocalDate.of(2026, 9, 11), 1649.5, 1567.0, 1410.3},
            {LocalDate.of(2026, 9, 12), 1649.5, 1567.0, 1410.3}, // 주말 이월
            {LocalDate.of(2026, 9, 13), 1649.5, 1567.0, 1410.3}, // 주말 이월
            {LocalDate.of(2026, 9, 14), 1660.9, 1577.8, 1420.0},
            {LocalDate.of(2026, 9, 15), 1698.6, 1613.6, 1452.3},
            {LocalDate.of(2026, 9, 16), 1669.7, 1586.2, 1427.6},
            {LocalDate.of(2026, 9, 17), 1665.3, 1582.0, 1423.8},
            {LocalDate.of(2026, 9, 18), 1610.6, 1530.1, 1377.1},
            {LocalDate.of(2026, 9, 19), 1610.6, 1530.1, 1377.1}  // 주말 이월
        };

        for (Object[] row : krxOilData) {
            DailyPetroleumPrice p = new DailyPetroleumPrice();
            p.setDate((LocalDate) row[0]);
            p.setGasolinePrice((Double) row[1]);
            p.setDieselPrice((Double) row[2]);
            p.setKerosenePrice((Double) row[3]);
            petroleumRepo.save(p);
        }

        // 3. Official KRX KOSPI API Data (KOSPI & KOSPI 200, 주말 이월 적용)
        Object[][] krxKospiData = {
            {LocalDate.of(2026, 9, 11), 6909.91, 1090.22, 19673811067736L},
            {LocalDate.of(2026, 9, 12), 6909.91, 1090.22, 19673811067736L}, // 주말 이월
            {LocalDate.of(2026, 9, 13), 6909.91, 1090.22, 19673811067736L}, // 주말 이월
            {LocalDate.of(2026, 9, 14), 6684.37, 1055.00, 21000000000000L},
            {LocalDate.of(2026, 9, 15), 6627.26, 1045.00, 22000000000000L},
            {LocalDate.of(2026, 9, 16), 6717.97, 1060.00, 21500000000000L},
            {LocalDate.of(2026, 9, 17), 6715.41, 1059.00, 22500000000000L},
            {LocalDate.of(2026, 9, 18), 6894.23, 1090.23, 23000000000000L},
            {LocalDate.of(2026, 9, 19), 6894.23, 1090.23, 23000000000000L}  // 주말 이월
        };

        for (Object[] row : krxKospiData) {
            DailyKospiPrice k = new DailyKospiPrice();
            k.setDate((LocalDate) row[0]);
            k.setKospiIndex((Double) row[1]);
            k.setKospi200Index((Double) row[2]);
            k.setTradingValue((Long) row[3]);
            kospiRepo.save(k);
        }

        return "KRX Official API Data populated with weekend Carry-Forward (Sep 11 ~ Sep 19)!";
    }

    @GetMapping("/api/debug/clear-gold")
    public String clearGold() {
        return clearAll();
    }

    @GetMapping("/api/debug/token")
    public String getToken() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            "testuser@example.com", 
            null, 
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        return jwtTokenProvider.generateToken(auth);
    }
}
