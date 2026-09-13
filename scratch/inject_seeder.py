import codecs

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/web/DebugController.java', 'r', 'utf-8') as f:
    content = f.read()

imports = """import com.minibig.karatflow.backend.domain.DailyMetalPrice;
import com.minibig.karatflow.backend.domain.DailyPetroleumPrice;
import com.minibig.karatflow.backend.domain.DailyKospiPrice;
import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;
import com.minibig.karatflow.backend.repository.DailyPetroleumPriceRepository;
import com.minibig.karatflow.backend.repository.DailyKospiPriceRepository;
"""

content = content.replace("import com.minibig.karatflow.backend.domain.DailyMetalPrice;", imports)
content = content.replace("import com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;", "")

repo_injections = """
    private final DailyMetalPriceRepository repository;
    private final DailyPetroleumPriceRepository petroleumRepo;
    private final DailyKospiPriceRepository kospiRepo;
"""
content = content.replace("private final DailyMetalPriceRepository repository;", repo_injections)

new_method = """
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
"""

content = content.replace("public String clearGold() {", new_method + "\n\n    @GetMapping(\"/api/debug/clear-gold\")\n    public String clearGold() {")

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/web/DebugController.java', 'w', 'utf-8') as f:
    f.write(content)

print("Updated DebugController.java successfully.")
