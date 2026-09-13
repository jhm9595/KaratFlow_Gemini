package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import com.minibig.karatflow.backend.domain.DailyPetroleumPrice;
import com.minibig.karatflow.backend.domain.DailyKospiPrice;

import com.minibig.karatflow.backend.repository.DailyPetroleumPriceRepository;
import com.minibig.karatflow.backend.repository.DailyKospiPriceRepository;


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
        clearGold();
        
        petroleumRepo.deleteAll();
        kospiRepo.deleteAll();
        
        Object[][] oilData = {
            {LocalDate.of(2026, 9, 1), 1779.0, 1768.0, 0.0},
            {LocalDate.of(2026, 9, 2), 1779.0, 1768.0, 0.0},
            {LocalDate.of(2026, 9, 3), 1779.0, 1768.0, 0.0},
            {LocalDate.of(2026, 9, 4), 1779.0, 1768.0, 0.0},
            {LocalDate.of(2026, 9, 5), 0.0, 0.0, 0.0},
            {LocalDate.of(2026, 9, 6), 0.0, 0.0, 0.0},
            {LocalDate.of(2026, 9, 7), 0.0, 0.0, 0.0},
            {LocalDate.of(2026, 9, 8), 1779.0, 1768.0, 0.0},
            {LocalDate.of(2026, 9, 9), 1779.0, 1768.0, 0.0},
            {LocalDate.of(2026, 9, 10), 1779.0, 1768.0, 0.0},
            {LocalDate.of(2026, 9, 11), 1779.0, 1768.0, 1375.0},
            {LocalDate.of(2026, 9, 12), 0.0, 0.0, 0.0}
        };

        for (Object[] row : oilData) {
            DailyPetroleumPrice p = new DailyPetroleumPrice();
            p.setDate((LocalDate) row[0]);
            p.setGasolinePrice((Double) row[1]);
            p.setDieselPrice((Double) row[2]);
            p.setKerosenePrice((Double) row[3]);
            petroleumRepo.save(p);
        }

        Object[][] kospiData = {
            {LocalDate.of(2026, 9, 1), 6835.8, 1075.3, 19202722747021L},
            {LocalDate.of(2026, 9, 2), 6562.72, 1031.53, 18775698190444L},
            {LocalDate.of(2026, 9, 3), 6579.48, 1032.82, 22164336072764L},
            {LocalDate.of(2026, 9, 4), 6687.21, 1051.52, 17723233066259L},
            {LocalDate.of(2026, 9, 5), 0.0, 0.0, 0L},
            {LocalDate.of(2026, 9, 6), 0.0, 0.0, 0L},
            {LocalDate.of(2026, 9, 7), 6995.39, 1105.19, 21761747526471L},
            {LocalDate.of(2026, 9, 8), 6954.52, 1100.08, 26187187273637L},
            {LocalDate.of(2026, 9, 9), 7051.64, 1114.61, 22625312015892L},
            {LocalDate.of(2026, 9, 10), 7033.92, 1112.13, 28927397176014L},
            {LocalDate.of(2026, 9, 11), 6909.91, 1090.22, 19673811067736L},
            {LocalDate.of(2026, 9, 12), 0.0, 0.0, 0L}
        };

        for (Object[] row : kospiData) {
            DailyKospiPrice k = new DailyKospiPrice();
            k.setDate((LocalDate) row[0]);
            k.setKospiIndex((Double) row[1]);
            k.setKospi200Index((Double) row[2]);
            k.setTradingValue((Long) row[3]);
            kospiRepo.save(k);
        }

        return "Cleared and filled with real KRX data for GOLD, PETROLEUM, and KOSPI (Sep 1 to 12)!";
    }


    @GetMapping("/api/debug/clear-gold")
    public String clearGold() {
        repository.deleteAll();
        
        // date, price, volume, value
        Object[][] realData = {
            {LocalDate.of(2026, 9, 1), 196280.0 * 3.75, 221569.0, 43565296190.0},
            {LocalDate.of(2026, 9, 2), 190810.0 * 3.75, 251698.0, 48013527000.0},
            {LocalDate.of(2026, 9, 3), 194190.0 * 3.75, 238883.0, 46341887850.0},
            {LocalDate.of(2026, 9, 4), 194970.0 * 3.75, 154414.0, 30225312770.0},
            {LocalDate.of(2026, 9, 5), 194970.0 * 3.75, 0.0, 0.0},
            {LocalDate.of(2026, 9, 6), 194970.0 * 3.75, 0.0, 0.0},
            {LocalDate.of(2026, 9, 7), 190630.0 * 3.75, 229422.0, 43924623140.0},
            {LocalDate.of(2026, 9, 8), 191170.0 * 3.75, 165856.0, 31764638020.0},
            {LocalDate.of(2026, 9, 9), 191000.0 * 3.75, 212682.0, 40150618380.0},
            {LocalDate.of(2026, 9, 10), 191500.0 * 3.75, 199990.0, 38144011250.0},
            {LocalDate.of(2026, 9, 11), 191500.0 * 3.75, 0.0, 0.0},
            {LocalDate.of(2026, 9, 12), 191500.0 * 3.75, 0.0, 0.0}
        };

        for (Object[] row : realData) {
            DailyMetalPrice price = new DailyMetalPrice();
            price.setPriceDate((LocalDate) row[0]);
            price.setMetalType("GOLD_24K");
            price.setPricePer375g((Double) row[1]);
            price.setTradingVolume((Double) row[2]);
            price.setTradingValue((Double) row[3]);
            repository.save(price);
        }

        return "Cleared and filled with real KRX data (Sep 1 to 12) including volume and value!";
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
