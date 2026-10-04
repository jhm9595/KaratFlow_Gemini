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
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate = new RestTemplate();
    private final java.util.concurrent.atomic.AtomicBoolean isSyncing = new java.util.concurrent.atomic.AtomicBoolean(false);

    @Value("${krx.api.key:}")
    private String krxApiKey;

    @jakarta.annotation.PostConstruct
    public void initSyncOnStartup() {
        try {
            jdbcTemplate.execute("ALTER TABLE daily_metal_prices ALTER COLUMN price_per375g SET NULL");
        } catch (Exception ignored) {}
        log.info("KRX Sync: Triggering startup market data catch-up sync asynchronously...");
        java.util.concurrent.CompletableFuture.runAsync(this::triggerSyncIfNecessary);
    }

    public void triggerSyncIfNecessary() {
        if (!isSyncing.compareAndSet(false, true)) {
            log.info("KRX Sync: Catch-up sync already running. Skipping duplicate trigger.");
            return;
        }

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                LocalDate today = LocalDate.now();
                long goldCount = dailyMetalPriceRepository.count();
                boolean hasGoldToday = dailyMetalPriceRepository.findByPriceDateAndMetalType(today, "GOLD_24K").isPresent();
                boolean hasOilToday = dailyPetroleumPriceRepository.findByDate(today).isPresent();
                boolean hasKospiToday = dailyKospiPriceRepository.findByDate(today).isPresent();

                if (hasGoldToday && hasOilToday && hasKospiToday && goldCount >= 700) {
                    log.info("KRX Sync: All market data up to date for {} (Count: {}). Skipping API calls.", today, goldCount);
                    return;
                }

                log.info("KRX Sync: Catch-up sync running in background (Today present: {}, Gold Count: {}).", hasGoldToday, goldCount);
                syncGold(today);
                syncOil(today);
                syncKospi(today);
            } catch (Exception e) {
                log.error("KRX Sync error: {}", e.getMessage(), e);
            } finally {
                isSyncing.set(false);
            }
        });
    }

    private void syncGold(LocalDate today) {
        Optional<DailyMetalPrice> latestOpt = dailyMetalPriceRepository.findFirstByMetalTypeOrderByPriceDateDesc("GOLD_24K");
        Optional<DailyMetalPrice> oldestOpt = dailyMetalPriceRepository.findFirstByMetalTypeOrderByPriceDateAsc("GOLD_24K");

        // 1. Sync from latest existing date up to today FIRST (takes ~3 seconds for missing recent days)
        LocalDate latestStart = latestOpt.isPresent() ? latestOpt.get().getPriceDate().plusDays(1) : today.minusDays(30);
        if (!latestStart.isAfter(today)) {
            syncGoldRange(latestStart, today);
        }

        // 2. Backfill older historical data if needed
        LocalDate targetStart = today.minusDays(1095);
        if (!oldestOpt.isPresent() || oldestOpt.get().getPriceDate().isAfter(targetStart)) {
            LocalDate backfillStart = targetStart;
            LocalDate backfillEnd = oldestOpt.isPresent() ? oldestOpt.get().getPriceDate().minusDays(1) : today;
            if (!backfillStart.isAfter(backfillEnd)) {
                syncGoldRange(backfillStart, backfillEnd);
            }
        }
    }

    private void syncGoldRange(LocalDate startDate, LocalDate endDate) {
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (dailyMetalPriceRepository.findByPriceDateAndMetalType(date, "GOLD_24K").isPresent()) {
                continue;
            }

            boolean saved = false;
            boolean isWeekend = (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY);

            if (!isWeekend && krxApiKey != null && !krxApiKey.trim().isEmpty()) {
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
                                    double clpr = parseNumeric(item.get("TDD_CLSPRC"), 0.0);
                                    double vol = parseNumeric(item.get("ACC_TRDVOL"), 0.0);
                                    double val = parseNumeric(item.get("ACC_TRDVAL"), 0.0);

                                    DailyMetalPrice newPrice = new DailyMetalPrice();
                                    newPrice.setPriceDate(date);
                                    newPrice.setMetalType("GOLD_24K");
                                    newPrice.setPricePerGram(clpr);
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
                    log.info("KRX Gold (Carry-Forward): Saved g-price {} for {}", prev.getEffectiveGramPrice(), date);
                }
            }
        }
    }

    private void syncOil(LocalDate today) {
        Optional<DailyPetroleumPrice> latestOpt = dailyPetroleumPriceRepository.findFirstByOrderByDateDesc();
        Optional<DailyPetroleumPrice> oldestOpt = dailyPetroleumPriceRepository.findFirstByOrderByDateAsc();

        LocalDate latestStart = latestOpt.isPresent() ? latestOpt.get().getDate().plusDays(1) : today.minusDays(30);
        if (!latestStart.isAfter(today)) {
            syncOilRange(latestStart, today);
        }

        LocalDate targetStart = today.minusDays(1095);
        if (!oldestOpt.isPresent() || oldestOpt.get().getDate().isAfter(targetStart)) {
            LocalDate backfillStart = targetStart;
            LocalDate backfillEnd = oldestOpt.isPresent() ? oldestOpt.get().getDate().minusDays(1) : today;
            if (!backfillStart.isAfter(backfillEnd)) {
                syncOilRange(backfillStart, backfillEnd);
            }
        }
    }

    private void syncOilRange(LocalDate startDate, LocalDate endDate) {
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (dailyPetroleumPriceRepository.findByDate(date).isPresent()) {
                continue;
            }

            boolean saved = false;
            boolean isWeekend = (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY);

            if (!isWeekend && krxApiKey != null && !krxApiKey.trim().isEmpty()) {
                try { Thread.sleep(200); } catch (InterruptedException ignored) {}

                String basDd = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
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
                                String prcStr = String.valueOf(item.get("WT_AVG_PRC")).replace(",", "").trim();
                                if (prcStr.isEmpty()) continue;
                                double prc = Double.parseDouble(prcStr);
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
                    log.info("KRX Oil (Carry-Forward): Saved oil price for {}", date);
                }
            }
        }
    }

    private void syncKospi(LocalDate today) {
        Optional<DailyKospiPrice> latestOpt = dailyKospiPriceRepository.findFirstByOrderByDateDesc();
        Optional<DailyKospiPrice> oldestOpt = dailyKospiPriceRepository.findFirstByOrderByDateAsc();

        LocalDate latestStart = latestOpt.isPresent() ? latestOpt.get().getDate().plusDays(1) : today.minusDays(30);
        if (!latestStart.isAfter(today)) {
            syncKospiRange(latestStart, today);
        }

        LocalDate targetStart = today.minusDays(1095);
        if (!oldestOpt.isPresent() || oldestOpt.get().getDate().isAfter(targetStart)) {
            LocalDate backfillStart = targetStart;
            LocalDate backfillEnd = oldestOpt.isPresent() ? oldestOpt.get().getDate().minusDays(1) : today;
            if (!backfillStart.isAfter(backfillEnd)) {
                syncKospiRange(backfillStart, backfillEnd);
            }
        }
    }

    private void syncKospiRange(LocalDate startDate, LocalDate endDate) {
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (dailyKospiPriceRepository.findByDate(date).isPresent()) {
                continue;
            }

            boolean saved = false;
            boolean isWeekend = (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY);

            if (!isWeekend && krxApiKey != null && !krxApiKey.trim().isEmpty()) {
                try { Thread.sleep(200); } catch (InterruptedException ignored) {}

                String basDd = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
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
                                String clsprcStr = String.valueOf(item.get("CLSPRC_IDX")).replace(",", "").trim();
                                if (clsprcStr.isEmpty()) continue;
                                double clsprc = Double.parseDouble(clsprcStr);

                                String trdValStr = String.valueOf(item.get("ACC_TRDVAL")).replace(",", "").trim();
                                long trdVal = trdValStr.isEmpty() ? 0L : Long.parseLong(trdValStr);

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
                                log.info("KRX KOSPI: Saved KOSPI:{} KOSPI200:{} for {}", kospi, kospi200, date);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("KRX Kospi API call failed for {}: {}", date, e.getMessage());
                }
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
                    log.info("KRX KOSPI (Carry-Forward): Saved KOSPI {} for {}", prev.getKospiIndex(), date);
                }
            }
        }
    }

    private double parseNumeric(Object valObj, double defaultVal) {
        if (valObj == null) return defaultVal;
        String str = String.valueOf(valObj).replace(",", "").trim();
        if (str.isEmpty() || "-".equals(str) || "null".equalsIgnoreCase(str)) return defaultVal;
        try {
            return Double.parseDouble(str);
        } catch (NumberFormatException e) {
            log.warn("KRX Sync: Failed to parse numeric value '{}'", str);
            return defaultVal;
        }
    }
}
