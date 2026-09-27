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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
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
public class KrxMarketDataSyncService {

    private final DailyMetalPriceRepository dailyMetalPriceRepository;
    private final DailyPetroleumPriceRepository dailyPetroleumPriceRepository;
    private final DailyKospiPriceRepository dailyKospiPriceRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${krx.api.key:}")
    private String krxApiKey;

    /**
     * Trigger sync check when user logs in or requests market metrics.
     * If DB already has data up to today, returns immediately with 0 API calls.
     */
    public void triggerSyncIfNecessary() {
        LocalDate today = LocalDate.now();

        long goldCount = dailyMetalPriceRepository.count();
        boolean hasGoldToday = dailyMetalPriceRepository.findByPriceDateAndMetalType(today, "GOLD_24K").isPresent();
        boolean hasOilToday = dailyPetroleumPriceRepository.findByDate(today).isPresent();
        boolean hasKospiToday = dailyKospiPriceRepository.findByDate(today).isPresent();

        if (hasGoldToday && hasOilToday && hasKospiToday && goldCount >= 700) {
            log.info("KRX Sync: All market data up to date for {} (Count: {}). Skipping API calls.", today, goldCount);
            return;
        }

        log.info("KRX Sync: Catch-up sync triggered (Today present: {}, Gold Count: {}).", hasGoldToday, goldCount);
        syncMarketDataAsync(today);
    }

    /**
     * Asynchronously catch-up sync missing dates up to today without blocking UI.
     */
    @Async
    @Transactional
    public void syncMarketDataAsync(LocalDate today) {
        if (krxApiKey == null || krxApiKey.trim().isEmpty()) {
            log.warn("KRX API Key missing. Skipping async sync.");
            return;
        }

        syncGold(today);
        syncOil(today);
        syncKospi(today);
    }

    private void syncGold(LocalDate today) {
        Optional<DailyMetalPrice> latestOpt = dailyMetalPriceRepository.findFirstByMetalTypeOrderByPriceDateDesc("GOLD_24K");
        LocalDate startDate = latestOpt.isPresent() ? latestOpt.get().getPriceDate().plusDays(1) : today.minusDays(1095);

        if (startDate.isAfter(today)) return;

        for (LocalDate date = startDate; !date.isAfter(today); date = date.plusDays(1)) {
            if (dailyMetalPriceRepository.findByPriceDateAndMetalType(date, "GOLD_24K").isPresent()) {
                continue;
            }

            boolean saved = false;

            // Skip HTTP call on Saturdays and Sundays (KRX market closed)
            boolean isWeekend = (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY);

            if (!isWeekend) {
                // Rate-limit defense: 200ms sleep between weekday calls (<5 calls/sec)
                try { Thread.sleep(200); } catch (InterruptedException ignored) {}

                String basDd = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
                try {
                    String rawUri = "https://data-dbg.krx.co.kr/svc/apis/gen/gold_bydd_trd?basDd=" + basDd;
                    HttpHeaders headers = new HttpHeaders();
                    headers.set("AUTH_KEY", krxApiKey);
                    HttpEntity<String> entity = new HttpEntity<>(headers);
                    ResponseEntity<Map> response = restTemplate.exchange(new URI(rawUri), HttpMethod.GET, entity, Map.class);

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
                                    newPrice.setPriceDate(date);
                                    newPrice.setMetalType("GOLD_24K");
                                    newPrice.setPricePerGram(clpr); // raw KRX g-unit price
                                    newPrice.setPricePer375g((double) Math.round(clpr * 3.75));
                                    newPrice.setTradingVolume(vol);
                                    newPrice.setTradingValue(val);
                                    dailyMetalPriceRepository.save(newPrice);
                                    saved = true;
                                    log.info("KRX Gold: Saved raw g-price {} won/g for {}", clpr, date);
                                    break;
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("KRX Gold API call failed for {}: {}", date, e.getMessage());
                }
            }

            // Holiday / No-data handling: Write Carry-Forward price into DB
            if (!saved) {
                Optional<DailyMetalPrice> prevOpt = dailyMetalPriceRepository.findFirstByMetalTypeOrderByPriceDateDesc("GOLD_24K");
                if (prevOpt.isPresent()) {
                    DailyMetalPrice prev = prevOpt.get();
                    DailyMetalPrice cfPrice = new DailyMetalPrice();
                    cfPrice.setPriceDate(date);
                    cfPrice.setMetalType("GOLD_24K");
                    cfPrice.setPricePerGram(prev.getEffectiveGramPrice());
                    cfPrice.setPricePer375g(prev.getEffective375gPrice());
                    cfPrice.setTradingVolume(prev.getTradingVolume());
                    cfPrice.setTradingValue(prev.getTradingValue());
                    dailyMetalPriceRepository.save(cfPrice);
                    log.info("KRX Gold (Holiday): Saved Carry-Forward g-price {} for {}", prev.getEffectiveGramPrice(), date);
                }
            }
        }
    }

    private void syncOil(LocalDate today) {
        Optional<DailyPetroleumPrice> latestOpt = dailyPetroleumPriceRepository.findFirstByOrderByDateDesc();
        LocalDate startDate = latestOpt.isPresent() ? latestOpt.get().getDate().plusDays(1) : today.minusDays(7);

        if (startDate.isAfter(today)) return;

        for (LocalDate date = startDate; !date.isAfter(today); date = date.plusDays(1)) {
            if (dailyPetroleumPriceRepository.findByDate(date).isPresent()) {
                continue;
            }

            try { Thread.sleep(250); } catch (InterruptedException ignored) {}

            String basDd = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            boolean saved = false;

            try {
                String rawUri = "https://data-dbg.krx.co.kr/svc/apis/gen/oil_bydd_trd?basDd=" + basDd;
                HttpHeaders headers = new HttpHeaders();
                headers.set("AUTH_KEY", krxApiKey);
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<Map> response = restTemplate.exchange(new URI(rawUri), HttpMethod.GET, entity, Map.class);

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
                            newPrice.setDate(date);
                            newPrice.setGasolinePrice(gasoline);
                            newPrice.setDieselPrice(diesel);
                            newPrice.setKerosenePrice(kerosene);
                            dailyPetroleumPriceRepository.save(newPrice);
                            saved = true;
                            log.info("KRX Oil: Saved Gas:{} Diesel:{} for {}", gasoline, diesel, date);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("KRX Oil API call failed for {}: {}", date, e.getMessage());
            }

            if (!saved) {
                Optional<DailyPetroleumPrice> prevOpt = dailyPetroleumPriceRepository.findFirstByOrderByDateDesc();
                if (prevOpt.isPresent()) {
                    DailyPetroleumPrice prev = prevOpt.get();
                    DailyPetroleumPrice cfPrice = new DailyPetroleumPrice();
                    cfPrice.setDate(date);
                    cfPrice.setGasolinePrice(prev.getGasolinePrice());
                    cfPrice.setDieselPrice(prev.getDieselPrice());
                    cfPrice.setKerosenePrice(prev.getKerosenePrice());
                    dailyPetroleumPriceRepository.save(cfPrice);
                    log.info("KRX Oil (Holiday): Saved Carry-Forward oil price for {}", date);
                }
            }
        }
    }

    private void syncKospi(LocalDate today) {
        Optional<DailyKospiPrice> latestOpt = dailyKospiPriceRepository.findFirstByOrderByDateDesc();
        LocalDate startDate = latestOpt.isPresent() ? latestOpt.get().getDate().plusDays(1) : today.minusDays(7);

        if (startDate.isAfter(today)) return;

        for (LocalDate date = startDate; !date.isAfter(today); date = date.plusDays(1)) {
            if (dailyKospiPriceRepository.findByDate(date).isPresent()) {
                continue;
            }

            try { Thread.sleep(250); } catch (InterruptedException ignored) {}

            String basDd = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            boolean saved = false;

            try {
                String rawUri = "https://data-dbg.krx.co.kr/svc/apis/idx/kospi_dd_trd?basDd=" + basDd;
                HttpHeaders headers = new HttpHeaders();
                headers.set("AUTH_KEY", krxApiKey);
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<Map> response = restTemplate.exchange(new URI(rawUri), HttpMethod.GET, entity, Map.class);

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
                            newPrice.setDate(date);
                            newPrice.setKospiIndex(kospi);
                            newPrice.setKospi200Index(kospi200);
                            newPrice.setTradingValue(val);
                            dailyKospiPriceRepository.save(newPrice);
                            saved = true;
                            log.info("KRX KOSPI: Saved KOSPI:{} for {}", kospi, date);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("KRX Kospi API call failed for {}: {}", date, e.getMessage());
            }

            if (!saved) {
                Optional<DailyKospiPrice> prevOpt = dailyKospiPriceRepository.findFirstByOrderByDateDesc();
                if (prevOpt.isPresent()) {
                    DailyKospiPrice prev = prevOpt.get();
                    DailyKospiPrice cfPrice = new DailyKospiPrice();
                    cfPrice.setDate(date);
                    cfPrice.setKospiIndex(prev.getKospiIndex());
                    cfPrice.setKospi200Index(prev.getKospi200Index());
                    cfPrice.setTradingValue(prev.getTradingValue());
                    dailyKospiPriceRepository.save(cfPrice);
                    log.info("KRX KOSPI (Holiday): Saved Carry-Forward KOSPI {} for {}", prev.getKospiIndex(), date);
                }
            }
        }
    }
}
