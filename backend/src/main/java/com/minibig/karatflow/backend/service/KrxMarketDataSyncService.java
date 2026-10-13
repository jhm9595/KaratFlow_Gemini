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
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
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
                LocalDate targetEndDate = today.minusDays(1);
                log.info("KRX Sync: Catch-up sync running for confirmed closing prices up to yesterday ({})", targetEndDate);
                syncGold(targetEndDate);
                syncOil(targetEndDate);
                syncKospi(targetEndDate);
                cleanupUnconfirmedPrices(today);
                log.info("KRX Sync: Catch-up sync finished successfully.");
            } catch (Exception e) {
                log.error("KRX Sync error: {}", e.getMessage(), e);
            } finally {
                isSyncing.set(false);
            }
        });
    }

    private void cleanupUnconfirmedPrices(LocalDate today) {
        try {
            new org.springframework.transaction.support.TransactionTemplate(transactionManager).execute(status -> {
                dailyMetalPriceRepository.deleteByPriceDateGreaterThanEqual(today);
                dailyPetroleumPriceRepository.deleteByDateGreaterThanEqual(today);
                dailyKospiPriceRepository.deleteByDateGreaterThanEqual(today);
                return null;
            });
            log.info("KRX Sync: Successfully cleaned up unconfirmed future prices on/after {}", today);
        } catch (Exception e) {
            log.warn("Failed to cleanup unconfirmed prices on/after {}: {}", today, e.getMessage());
        }
    }

    private void syncGold(LocalDate targetEndDate) {
        // 1. Always verify recent 7 days up to targetEndDate (yesterday)
        LocalDate recentStart = targetEndDate.minusDays(7);
        syncGoldRange(recentStart, targetEndDate);

        // 2. Backfill older historical data if needed
        Optional<DailyMetalPrice> oldestOpt = dailyMetalPriceRepository.findFirstByMetalTypeOrderByPriceDateAsc("GOLD_24K");
        LocalDate targetStart = targetEndDate.minusDays(1095);
        if (!oldestOpt.isPresent() || oldestOpt.get().getPriceDate().isAfter(targetStart)) {
            LocalDate backfillStart = targetStart;
            LocalDate backfillEnd = oldestOpt.isPresent() ? oldestOpt.get().getPriceDate().minusDays(1) : targetEndDate.minusDays(8);
            if (!backfillStart.isAfter(backfillEnd)) {
                syncGoldRange(backfillStart, backfillEnd);
            }
        }
    }

    private void syncGoldRange(LocalDate startDate, LocalDate endDate) {
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            boolean isWeekend = (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY);
            Optional<DailyMetalPrice> existingOpt = dailyMetalPriceRepository.findByPriceDateAndMetalType(date, "GOLD_24K");

            // Skip if older than recent 7 days and already has verified trading volume
            if (date.isBefore(endDate.minusDays(6)) && existingOpt.isPresent() && existingOpt.get().getTradingVolume() != null && existingOpt.get().getTradingVolume() > 0) {
                continue;
            }

            boolean saved = false;

            if (!isWeekend && krxApiKey != null && !krxApiKey.trim().isEmpty()) {
                try { Thread.sleep(150); } catch (InterruptedException ignored) {}

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
                                String isuCd = String.valueOf(item.get("ISU_CD"));
                                String isuNm = String.valueOf(item.get("ISU_NM")).replaceAll("\\s+", "");
                                if ("04020000".equals(isuCd) || isuNm.contains("금99.99")) {
                                    double clpr = parseNumeric(item.get("TDD_CLSPRC"), 0.0);
                                    double vol = parseNumeric(item.get("ACC_TRDVOL"), 0.0);
                                    double val = parseNumeric(item.get("ACC_TRDVAL"), 0.0);

                                    if (clpr > 0) {
                                        DailyMetalPrice price = existingOpt.orElseGet(DailyMetalPrice::new);
                                        price.setPriceDate(date);
                                        price.setMetalType("GOLD_24K");
                                        price.setPricePerGram(clpr);
                                        price.setPricePer375g((double) Math.round(clpr * 3.75));
                                        price.setTradingVolume(vol);
                                        price.setTradingValue(val);
                                        dailyMetalPriceRepository.save(price);
                                        saved = true;
                                        log.info("KRX Gold: Saved/Updated raw g-price {} won/g for {}", clpr, date);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("KRX Gold API call failed for {}: {}", date, e.getMessage());
                }
            }

            if (!saved) {
                Optional<DailyMetalPrice> prevOpt = dailyMetalPriceRepository.findFirstByMetalTypeAndPriceDateLessThanOrderByPriceDateDesc("GOLD_24K", date);
                if (prevOpt.isPresent()) {
                    DailyMetalPrice prev = prevOpt.get();
                    DailyMetalPrice price = existingOpt.orElseGet(DailyMetalPrice::new);
                    price.setPriceDate(date);
                    price.setMetalType("GOLD_24K");
                    price.setPricePerGram(prev.getEffectiveGramPrice());
                    price.setPricePer375g(prev.getEffective375gPrice());
                    price.setTradingVolume(0.0);
                    price.setTradingValue(0.0);
                    dailyMetalPriceRepository.save(price);
                    log.info("KRX Gold (Carry-Forward): Saved g-price {} for {}", prev.getEffectiveGramPrice(), date);
                }
            }
        }
    }

    private void syncOil(LocalDate targetEndDate) {
        LocalDate recentStart = targetEndDate.minusDays(7);
        syncOilRange(recentStart, targetEndDate);

        Optional<DailyPetroleumPrice> oldestOpt = dailyPetroleumPriceRepository.findFirstByOrderByDateAsc();
        LocalDate targetStart = targetEndDate.minusDays(1095);
        if (!oldestOpt.isPresent() || oldestOpt.get().getDate().isAfter(targetStart)) {
            LocalDate backfillStart = targetStart;
            LocalDate backfillEnd = oldestOpt.isPresent() ? oldestOpt.get().getDate().minusDays(1) : targetEndDate.minusDays(8);
            if (!backfillStart.isAfter(backfillEnd)) {
                syncOilRange(backfillStart, backfillEnd);
            }
        }
    }

    private void syncOilRange(LocalDate startDate, LocalDate endDate) {
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            boolean isWeekend = (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY);
            Optional<DailyPetroleumPrice> existingOpt = dailyPetroleumPriceRepository.findByDate(date);

            if (date.isBefore(endDate.minusDays(6)) && existingOpt.isPresent() && existingOpt.get().getGasolinePrice() != null && existingOpt.get().getGasolinePrice() > 0) {
                continue;
            }

            boolean saved = false;

            if (!isWeekend && krxApiKey != null && !krxApiKey.trim().isEmpty()) {
                try { Thread.sleep(150); } catch (InterruptedException ignored) {}

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
                                double prc = parseNumeric(item.get("WT_AVG_PRC"), 0.0);
                                double disPrc = parseNumeric(item.get("WT_DIS_AVG_PRC"), 0.0);
                                double effectivePrice = prc > 0 ? prc : disPrc;

                                if ("휘발유".equals(oilNm)) gasoline = effectivePrice;
                                if ("경유".equals(oilNm)) diesel = effectivePrice;
                                if ("등유".equals(oilNm)) kerosene = effectivePrice;
                            }

                            if (gasoline > 0 || diesel > 0 || kerosene > 0) {
                                DailyPetroleumPrice price = existingOpt.orElseGet(DailyPetroleumPrice::new);
                                price.setDate(date);
                                price.setGasolinePrice(gasoline);
                                price.setDieselPrice(diesel);
                                price.setKerosenePrice(kerosene);
                                dailyPetroleumPriceRepository.save(price);
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
                Optional<DailyPetroleumPrice> prevOpt = dailyPetroleumPriceRepository.findFirstByDateLessThanOrderByDateDesc(date);
                if (prevOpt.isPresent()) {
                    DailyPetroleumPrice prev = prevOpt.get();
                    DailyPetroleumPrice price = existingOpt.orElseGet(DailyPetroleumPrice::new);
                    price.setDate(date);
                    price.setGasolinePrice(prev.getGasolinePrice());
                    price.setDieselPrice(prev.getDieselPrice());
                    price.setKerosenePrice(prev.getKerosenePrice());
                    dailyPetroleumPriceRepository.save(price);
                    log.info("KRX Oil (Carry-Forward): Saved oil price for {}", date);
                }
            }
        }
    }

    private void syncKospi(LocalDate targetEndDate) {
        LocalDate recentStart = targetEndDate.minusDays(7);
        syncKospiRange(recentStart, targetEndDate);

        Optional<DailyKospiPrice> oldestOpt = dailyKospiPriceRepository.findFirstByOrderByDateAsc();
        LocalDate targetStart = targetEndDate.minusDays(1095);
        if (!oldestOpt.isPresent() || oldestOpt.get().getDate().isAfter(targetStart)) {
            LocalDate backfillStart = targetStart;
            LocalDate backfillEnd = oldestOpt.isPresent() ? oldestOpt.get().getDate().minusDays(1) : targetEndDate.minusDays(8);
            if (!backfillStart.isAfter(backfillEnd)) {
                syncKospiRange(backfillStart, backfillEnd);
            }
        }
    }

    private void syncKospiRange(LocalDate startDate, LocalDate endDate) {
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            boolean isWeekend = (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY);
            Optional<DailyKospiPrice> existingOpt = dailyKospiPriceRepository.findByDate(date);

            if (date.isBefore(endDate.minusDays(6)) && existingOpt.isPresent() && existingOpt.get().getKospiIndex() != null && existingOpt.get().getKospiIndex() > 0) {
                continue;
            }

            boolean saved = false;

            if (!isWeekend && krxApiKey != null && !krxApiKey.trim().isEmpty()) {
                try { Thread.sleep(150); } catch (InterruptedException ignored) {}

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
                                DailyKospiPrice price = existingOpt.orElseGet(DailyKospiPrice::new);
                                price.setDate(date);
                                price.setKospiIndex(kospi);
                                price.setKospi200Index(kospi200);
                                price.setTradingValue(val);
                                dailyKospiPriceRepository.save(price);
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
                Optional<DailyKospiPrice> prevOpt = dailyKospiPriceRepository.findFirstByDateLessThanOrderByDateDesc(date);
                if (prevOpt.isPresent()) {
                    DailyKospiPrice prev = prevOpt.get();
                    DailyKospiPrice price = existingOpt.orElseGet(DailyKospiPrice::new);
                    price.setDate(date);
                    price.setKospiIndex(prev.getKospiIndex());
                    price.setKospi200Index(prev.getKospi200Index());
                    price.setTradingValue(0L);
                    dailyKospiPriceRepository.save(price);
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
