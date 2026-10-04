# Gold Price Process Handoff

## Purpose

This document explains how KaratFlow currently loads, stores, derives, and displays gold prices. It also lists recommended fixes for another agent to implement safely.

The key point: KRX provides the source gold market price for 24K-style pure gold only. KaratFlow derives 18K and 14K display prices from that source price using internal policy multipliers.

## Current Flow

### 1. Frontend fetch

`frontend/src/App.tsx` calls:

```ts
fetch('http://localhost:8888/api/metal-prices/recent', { headers: getAuthHeaders() })
```

The response is stored in `goldPriceData` and passed to:

- `frontend/src/components/widgets/GoldWidget.tsx`
- `frontend/src/GoldToolsModal.tsx`

### 2. Backend API

`backend/src/main/java/com/minibig/karatflow/backend/web/MetalPriceController.java`

Endpoint:

```text
GET /api/metal-prices/recent
```

Current behavior:

1. Calls `krxMarketDataSyncService.triggerSyncIfNecessary()`.
2. Reads all `GOLD_24K` rows from `daily_metal_prices`.
3. Converts each row into frontend fields:
   - `date`
   - `pricePerGram`
   - `price24k`
   - `price18k`
   - `price14k`
   - `volume`
   - `value`

Important detail:

- The sync is asynchronous and non-blocking.
- The API does not wait for KRX sync to finish.
- First response can still be stale or based on existing DB data.

### 3. KRX sync

`backend/src/main/java/com/minibig/karatflow/backend/service/KrxMarketDataSyncService.java`

Gold API endpoint:

```text
https://data-dbg.krx.co.kr/svc/apis/gen/gold_bydd_trd?basDd=yyyyMMdd
```

Auth header:

```text
AUTH_KEY: ${KRX_API_KEY}
```

The service selects the row where:

- `ISU_CD == "04020000"`, or
- `ISU_NM == "금99.99_1kg"`

KRX source fields:

- `TDD_CLSPRC`: closing price per gram
- `ACC_TRDVOL`: trading volume
- `ACC_TRDVAL`: trading value

Saved DB values:

- `pricePerGram = TDD_CLSPRC`
- `pricePer375g = round(TDD_CLSPRC * 3.75)`
- `tradingVolume = ACC_TRDVOL`
- `tradingValue = ACC_TRDVAL`
- `metalType = "GOLD_24K"`

### 4. Weekend and failure carry-forward

If the date is a weekend, or the KRX call fails, the service copies the latest saved gold price into the missing date.

This behavior is called carry-forward.

### 5. Startup and request-triggered sync

Sync is triggered in two ways:

- On backend startup via `@PostConstruct`.
- On `/api/metal-prices/recent` request.

Duplicate syncs are guarded by an `AtomicBoolean`.

## What Backfill Means

Backfill means filling missing historical data after the fact.

In this project, if the DB does not have enough old gold price rows, the sync service attempts to fill historical rows back to roughly 3 years ago:

```java
LocalDate targetStart = today.minusDays(1095);
```

So if the DB only has recent gold data, the service will query KRX for older dates and store those missing rows.

This is useful for historical charts, but the current frontend chart only displays the latest 7 rows. That means `/api/metal-prices/recent` should not return the entire 3-year dataset unless a longer chart actually needs it.

## Current Derived Price Policy

KRX only gives a pure-gold source price. KaratFlow currently derives 24K, 18K, and 14K prices like this:

```text
24K = pricePerGram * 3.75
18K = 24K * 0.825
14K = 24K * 0.6435
```

These 18K and 14K values are not directly from KRX. They are KaratFlow policy-derived prices.

Note:

- Pure metal ratio for 18K would normally be `0.75`.
- Pure metal ratio for 14K would normally be `0.585`.
- Current app uses `0.825` and `0.6435`, so these appear to include a business adjustment, not just purity.

Because this is a business pricing policy, the backend should be the source of truth.

## Why Keep Derived Calculation In Backend

Recommendation: keep 24K/18K/14K derivation in backend and remove frontend recalculation.

Reasons:

1. Gold prices affect settlement and invoice amounts, not just charts.
2. Backend already performs invoice calculation.
3. If frontend and backend both calculate derived values, they can drift.
4. 18K and 14K multipliers are internal policy, not raw KRX facts.
5. Backend calculation is easier to test, audit, log, and reuse across clients.

Frontend should receive final display-ready fields and render them without recalculating:

- `price24k`
- `price18k`
- `price14k`
- `pricePerGram`
- `pricePer375g`
- `priceDate`

## Recommended Fix List

### 1. Improve invoice fallback price

File:

- `backend/src/main/java/com/minibig/karatflow/backend/service/InvoiceCalculationService.java`

Current behavior:

- Looks for today's `GOLD_24K`.
- If missing, falls back to `400000.0`.

Recommended behavior:

- Look for today's `GOLD_24K`.
- If missing, use the latest available `GOLD_24K`.
- Only use a hardcoded emergency fallback if no DB price exists at all.

Why:

- KRX sync is asynchronous.
- Today may be missing during startup or before sync completes.
- Weekend or holiday behavior should use the latest market price, not a stale hardcoded number.

### 2. Remove frontend recalculation

Files:

- `frontend/src/components/widgets/GoldWidget.tsx`
- `frontend/src/GoldToolsModal.tsx`

Current behavior:

- Backend returns calculated `price24k`, `price18k`, `price14k`.
- `GoldWidget` recalculates them again from `pricePerGram`.

Recommended behavior:

- Use backend-provided values directly.
- Only fallback to calculation when old API data does not contain derived fields.
- Prefer removing fallback once API contract is stable.

Why:

- Avoid mismatches between chart/display and backend settlement policy.

### 3. Limit `/recent` response size

File:

- `backend/src/main/java/com/minibig/karatflow/backend/web/MetalPriceController.java`

Current behavior:

- Returns all `GOLD_24K` rows.

Recommended behavior:

- Return a bounded recent range, for example 30 or 90 days.
- Keep a separate endpoint if long historical charts are needed later.

Why:

- Backfill stores up to about 3 years of data.
- The current chart only displays 7 recent rows.
- Sending the full dataset wastes bandwidth and frontend work.

### 4. Return a typed DTO instead of `Map<String, Object>`

File:

- `backend/src/main/java/com/minibig/karatflow/backend/web/MetalPriceController.java`

Recommended shape:

```java
public record MetalPriceResponse(
    String priceDate,
    String displayDate,
    Double pricePerGram,
    Double pricePer375g,
    Double price24k,
    Double price18k,
    Double price14k,
    Double tradingVolume,
    Double tradingValue
) {}
```

Why:

- Makes the API contract explicit.
- Reduces frontend ambiguity.
- Makes future tests easier.

### 5. Preserve full price date

Current behavior:

- API returns `MM/dd` as `date`.

Recommended behavior:

- Return full ISO date as `priceDate`, for example `2026-10-04`.
- Optionally also return display label as `displayDate`.

Why:

- `MM/dd` is ambiguous across years.
- Invoice and settlement audit trails need precise dates.

### 6. Fix uniqueness model for future metal types

File:

- `backend/src/main/java/com/minibig/karatflow/backend/domain/DailyMetalPrice.java`

Current behavior:

- `priceDate` is unique by itself.

Recommended behavior:

- Use a composite unique constraint on `(priceDate, metalType)`.

Why:

- Current schema prevents storing multiple metal types for the same date.
- `metalType` already exists, so the model suggests future extensibility.

### 7. Remove hardcoded KRX API key default

File:

- `backend/src/main/resources/application.yml`

Current behavior:

```yaml
key: ${KRX_API_KEY:...}
```

Recommended behavior:

```yaml
key: ${KRX_API_KEY:}
```

Why:

- API keys should not live in source control.
- Missing key should be explicit in logs and health checks.

### 8. Add parsing helpers for KRX numeric fields

File:

- `backend/src/main/java/com/minibig/karatflow/backend/service/KrxMarketDataSyncService.java`

Current behavior:

- Directly parses strings after replacing commas.

Recommended behavior:

- Add a helper for nullable/blank/`-` numeric strings.
- Log malformed rows with date and field name.

Why:

- External API responses can contain empty values during holidays, corrections, or format changes.

### 9. Add sync status metadata

Possible response metadata:

```json
{
  "data": [],
  "meta": {
    "latestDate": "2026-10-04",
    "syncing": true,
    "stale": false
  }
}
```

Why:

- Frontend can display a clear state when backend is still catching up.
- Avoids implying that stale values are fully current.

### 10. Extract frontend gold-price hook

Suggested file:

- `frontend/src/hooks/useGoldPrices.ts`

Responsibilities:

- Fetch `/api/metal-prices/recent`.
- Track loading and error state.
- Expose `goldPriceData`.
- Optionally expose `todayGold`, `yesterdayGold`, and deltas only if the backend does not provide them.

Why:

- Keeps `App.tsx` simpler.
- Makes `GoldWidget` mostly presentational.

## Suggested Implementation Order

1. Fix invoice fallback to use latest DB gold price.
2. Make backend `/recent` the single source for derived 24K/18K/14K prices.
3. Remove frontend recalculation in `GoldWidget`.
4. Limit `/recent` to a reasonable recent window.
5. Add typed response DTO and full ISO date.
6. Add sync metadata if the UI will display it.
7. Clean up schema uniqueness and API key default.

## Verification Checklist

- Backend starts without errors.
- `/api/metal-prices/recent` returns gold price rows.
- Rows contain 24K, 18K, and 14K prices.
- Frontend dashboard still shows the gold widget.
- Gold chart still renders the latest data.
- Gold tools modal calculations still work.
- Invoice calculation uses today's price when present.
- Invoice calculation uses latest available price when today's price is missing.
- Weekend/carry-forward data still works.
- No frontend recalculation changes the backend-provided numbers.

