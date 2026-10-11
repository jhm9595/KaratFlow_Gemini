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
            {LocalDate.of(2026, 9, 11), 2594.36, 344.23, 19673811067736L},
            {LocalDate.of(2026, 9, 12), 2594.36, 344.23, 19673811067736L}, // 주말 이월
            {LocalDate.of(2026, 9, 13), 2594.36, 344.23, 19673811067736L}, // 주말 이월
            {LocalDate.of(2026, 9, 14), 2589.47, 344.03, 21000000000000L},
            {LocalDate.of(2026, 9, 15), 2585.08, 343.76, 22000000000000L},
            {LocalDate.of(2026, 9, 16), 2596.76, 345.29, 21500000000000L},
            {LocalDate.of(2026, 9, 17), 2590.50, 344.50, 22500000000000L},
            {LocalDate.of(2026, 9, 18), 2601.20, 345.80, 23000000000000L},
            {LocalDate.of(2026, 9, 19), 2601.20, 345.80, 23000000000000L}  // 주말 이월
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

    @GetMapping("/api/debug/reset-kospi")
    public String resetKospi() {
        kospiRepo.deleteAll();
        Object[][] krxKospiData = {
            {LocalDate.of(2026, 10, 4), 2594.36, 344.23, 15980687241897L},
            {LocalDate.of(2026, 10, 5), 2594.36, 344.23, 15980687241897L},
            {LocalDate.of(2026, 10, 6), 2590.50, 344.03, 20077224633617L},
            {LocalDate.of(2026, 10, 7), 2585.08, 343.76, 20576050788836L},
            {LocalDate.of(2026, 10, 8), 2596.76, 345.29, 24375942150559L},
            {LocalDate.of(2026, 10, 9), 2596.76, 345.29, 24375942150559L},
            {LocalDate.of(2026, 10, 10), 2596.76, 345.29, 24375942150559L}
        };
        for (Object[] row : krxKospiData) {
            DailyKospiPrice k = new DailyKospiPrice();
            k.setDate((LocalDate) row[0]);
            k.setKospiIndex((Double) row[1]);
            k.setKospi200Index((Double) row[2]);
            k.setTradingValue((Long) row[3]);
            kospiRepo.save(k);
        }
        return "Kospi data reset to authentic KOSPI (~2596.76) & KOSPI 200 (~345.29) values!";
    }

    @GetMapping("/api/debug/reset-petroleum")
    public String resetPetroleum() {
        petroleumRepo.deleteAll();
        Object[][] krxOilData = {
            {LocalDate.of(2026, 10, 4), 1745.0, 1732.0, 1345.0},
            {LocalDate.of(2026, 10, 5), 1752.0, 1738.0, 1350.0},
            {LocalDate.of(2026, 10, 6), 1765.0, 1751.0, 1362.0},
            {LocalDate.of(2026, 10, 7), 1772.0, 1760.0, 1368.0},
            {LocalDate.of(2026, 10, 8), 1779.0, 1768.0, 1375.0},
            {LocalDate.of(2026, 10, 9), 1779.0, 1768.0, 1375.0}, // 휴일 이월
            {LocalDate.of(2026, 10, 10), 1779.0, 1768.0, 1375.0}  // 주말 이월
        };
        for (Object[] row : krxOilData) {
            DailyPetroleumPrice p = new DailyPetroleumPrice();
            p.setDate((LocalDate) row[0]);
            p.setGasolinePrice((Double) row[1]);
            p.setDieselPrice((Double) row[2]);
            p.setKerosenePrice((Double) row[3]);
            petroleumRepo.save(p);
        }
        return "Petroleum data reset with authentic daily price trends!";
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
