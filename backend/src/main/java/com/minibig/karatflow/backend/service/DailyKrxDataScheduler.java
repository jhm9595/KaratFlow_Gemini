package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.DailyKospiPrice;
import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.domain.DailyPetroleumPrice;
import com.minibig.karatflow.backend.repository.DailyKospiPriceRepository;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import com.minibig.karatflow.backend.repository.DailyPetroleumPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyKrxDataScheduler {

    private final DailyMetalPriceRepository dailyMetalPriceRepository;
    private final DailyKospiPriceRepository dailyKospiPriceRepository;
    private final DailyPetroleumPriceRepository dailyPetroleumPriceRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${krx.api.key:}")
    private String krxApiKey;

    @Scheduled(cron = "0 30 16 * * ?")
    @Transactional
    public void fetchAllDailyKrxData() {
        log.info("Starting Daily KRX Data Fetch Scheduler (Gold, Oil, KOSPI)");
        LocalDate today = LocalDate.now();
        String basDd = today.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        if (krxApiKey == null || krxApiKey.trim().isEmpty()) {
            log.warn("KRX API Key is missing. Skipping scheduler.");
            return;
        }

        fetchGold(today, basDd);
        fetchOil(today, basDd);
        fetchKospi(today, basDd);
    }

    private void fetchGold(LocalDate today, String basDd) {
        if (dailyMetalPriceRepository.findByPriceDateAndMetalType(today, "GOLD_24K").isPresent()) {
            log.info("Gold price for {} already exists. Skipping.", today);
            return;
        }
        try {
            String rawUri = "https://data-dbg.krx.co.kr/svc/apis/gen/gold_bydd_trd?basDd=" + basDd;
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("AUTH_KEY", krxApiKey);
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            org.springframework.http.ResponseEntity<Map> response = restTemplate.exchange(new URI(rawUri), org.springframework.http.HttpMethod.GET, entity, Map.class);
            
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("OutBlock_1")) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) body.get("OutBlock_1");
                if (list != null && !list.isEmpty()) {
                    for (Map<String, Object> item : list) {
                        if ("04020000".equals(String.valueOf(item.get("ISU_CD"))) || "금99.99_1kg".equals(String.valueOf(item.get("ISU_NM")))) {
                            double clpr = Double.parseDouble(String.valueOf(item.get("TDD_CLSPRC")).replace(",", ""));
                            double vol = Double.parseDouble(String.valueOf(item.get("ACC_TRDVOL")).replace(",", ""));
                            double val = Double.parseDouble(String.valueOf(item.get("ACC_TRDVAL")).replace(",", ""));
                            
                            DailyMetalPrice newPrice = new DailyMetalPrice();
                            newPrice.setPriceDate(today);
                            newPrice.setMetalType("GOLD_24K");
                            newPrice.setPricePer375g((double) Math.round(clpr * 3.75));
                            newPrice.setTradingVolume(vol);
                            newPrice.setTradingValue(val);
                            dailyMetalPriceRepository.save(newPrice);
                            log.info("KRX Gold: Saved {} won", newPrice.getPricePer375g());
                            return;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("KRX Gold API Call failed: {}", e.getMessage());
        }
    }

    private void fetchOil(LocalDate today, String basDd) {
        if (dailyPetroleumPriceRepository.findByDate(today).isPresent()) {
            log.info("Oil price for {} already exists. Skipping.", today);
            return;
        }
        try {
            String rawUri = "https://data-dbg.krx.co.kr/svc/apis/gen/oil_bydd_trd?basDd=" + basDd;
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("AUTH_KEY", krxApiKey);
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            org.springframework.http.ResponseEntity<Map> response = restTemplate.exchange(new URI(rawUri), org.springframework.http.HttpMethod.GET, entity, Map.class);
            
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("OutBlock_1")) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) body.get("OutBlock_1");
                if (list != null && !list.isEmpty()) {
                    Double gasoline = 0.0;
                    Double diesel = 0.0;
                    Double kerosene = 0.0;
                    
                    for (Map<String, Object> item : list) {
                        String oilNm = String.valueOf(item.get("OIL_NM"));
                        double prc = Double.parseDouble(String.valueOf(item.get("WT_AVG_PRC")).replace(",", ""));
                        if ("휘발유".equals(oilNm)) gasoline = prc;
                        if ("경유".equals(oilNm)) diesel = prc;
                        if ("등유".equals(oilNm)) kerosene = prc;
                    }
                    
                    if (gasoline > 0 || diesel > 0 || kerosene > 0) {
                        DailyPetroleumPrice newPrice = new DailyPetroleumPrice();
                        newPrice.setDate(today);
                        newPrice.setGasolinePrice(gasoline);
                        newPrice.setDieselPrice(diesel);
                        newPrice.setKerosenePrice(kerosene);
                        dailyPetroleumPriceRepository.save(newPrice);
                        log.info("KRX Oil: Saved Gas:{} Diesel:{} Kerosene:{}", gasoline, diesel, kerosene);
                    }
                }
            }
        } catch (Exception e) {
            log.error("KRX Oil API Call failed: {}", e.getMessage());
        }
    }

    private void fetchKospi(LocalDate today, String basDd) {
        if (dailyKospiPriceRepository.findByDate(today).isPresent()) {
            log.info("KOSPI for {} already exists. Skipping.", today);
            return;
        }
        try {
            String rawUri = "https://data-dbg.krx.co.kr/svc/apis/gen/kospi_dd_trd?basDd=" + basDd;
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("AUTH_KEY", krxApiKey);
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            org.springframework.http.ResponseEntity<Map> response = restTemplate.exchange(new URI(rawUri), org.springframework.http.HttpMethod.GET, entity, Map.class);
            
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("OutBlock_1")) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) body.get("OutBlock_1");
                if (list != null && !list.isEmpty()) {
                    Double kospi = 0.0;
                    Double kospi200 = 0.0;
                    Long val = 0L;
                    
                    for (Map<String, Object> item : list) {
                        String idxNm = String.valueOf(item.get("IDX_NM"));
                        double clsprc = Double.parseDouble(String.valueOf(item.get("CLSPRC_IDX")).replace(",", ""));
                        long trdVal = Long.parseLong(String.valueOf(item.get("ACC_TRDVAL")).replace(",", ""));
                        if ("코스피".equals(idxNm)) {
                            kospi = clsprc;
                            val = trdVal;
                        }
                        if ("코스피 200".equals(idxNm)) {
                            kospi200 = clsprc;
                        }
                    }
                    
                    if (kospi > 0) {
                        DailyKospiPrice newPrice = new DailyKospiPrice();
                        newPrice.setDate(today);
                        newPrice.setKospiIndex(kospi);
                        newPrice.setKospi200Index(kospi200);
                        newPrice.setTradingValue(val);
                        dailyKospiPriceRepository.save(newPrice);
                        log.info("KRX KOSPI: Saved KOSPI:{} KOSPI200:{}", kospi, kospi200);
                    }
                }
            }
        } catch (Exception e) {
            log.error("KRX KOSPI API Call failed: {}", e.getMessage());
        }
    }
}
