package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.DailyKospiPrice;
import com.minibig.karatflow.backend.domain.DailyPetroleumPrice;
import com.minibig.karatflow.backend.repository.DailyKospiPriceRepository;
import com.minibig.karatflow.backend.repository.DailyPetroleumPriceRepository;
import com.minibig.karatflow.backend.service.KrxMarketDataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/global-metrics")
public class GlobalMetricsController {

    private final DailyPetroleumPriceRepository petroleumRepo;
    private final DailyKospiPriceRepository kospiRepo;
    private final KrxMarketDataSyncService krxMarketDataSyncService;

    @GetMapping("/petroleum/history")
    public ResponseEntity<List<DailyPetroleumPrice>> getPetroleumHistory() {
        krxMarketDataSyncService.triggerSyncIfNecessary();

        List<DailyPetroleumPrice> all = petroleumRepo.findAllByOrderByDateAsc();
        double lastGas = 0, lastDie = 0, lastKer = 0;
        for (DailyPetroleumPrice p : all) {
            if (p.getGasolinePrice() != null && p.getGasolinePrice() > 0) lastGas = p.getGasolinePrice();
            else p.setGasolinePrice(lastGas);
            
            if (p.getDieselPrice() != null && p.getDieselPrice() > 0) lastDie = p.getDieselPrice();
            else p.setDieselPrice(lastDie);
            
            if (p.getKerosenePrice() != null && p.getKerosenePrice() > 0) lastKer = p.getKerosenePrice();
            else p.setKerosenePrice(lastKer);
        }
        List<DailyPetroleumPrice> recent = all.size() > 7 ? all.subList(all.size() - 7, all.size()) : all;
        return ResponseEntity.ok(recent);
    }

    @GetMapping("/kospi/history")
    public ResponseEntity<List<DailyKospiPrice>> getKospiHistory() {
        krxMarketDataSyncService.triggerSyncIfNecessary();

        List<DailyKospiPrice> all = kospiRepo.findAllByOrderByDateAsc();
        double lastKospi = 0, lastKospi200 = 0;
        for (DailyKospiPrice k : all) {
            if (k.getKospiIndex() != null && k.getKospiIndex() > 0) lastKospi = k.getKospiIndex();
            else k.setKospiIndex(lastKospi);
            
            if (k.getKospi200Index() != null && k.getKospi200Index() > 0) lastKospi200 = k.getKospi200Index();
            else k.setKospi200Index(lastKospi200);
        }
        List<DailyKospiPrice> recent = all.size() > 7 ? all.subList(all.size() - 7, all.size()) : all;
        return ResponseEntity.ok(recent);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getGlobalMetrics() {
        krxMarketDataSyncService.triggerSyncIfNecessary();
        return ResponseEntity.ok(Collections.emptyMap());
    }
}
