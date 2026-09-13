import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/web/GlobalMetricsController.java'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

imports = """import com.minibig.karatflow.backend.repository.DailyPetroleumPriceRepository;
import com.minibig.karatflow.backend.repository.DailyKospiPriceRepository;
import lombok.RequiredArgsConstructor;
import java.time.LocalDate;
"""

content = content.replace("import java.util.List;", "import java.util.List;\n" + imports)

# Add @RequiredArgsConstructor
content = content.replace("@RestController", "@RestController\n@RequiredArgsConstructor")

# Add repositories injection
repos = """
    private final DailyPetroleumPriceRepository petroleumRepo;
    private final DailyKospiPriceRepository kospiRepo;
"""
content = content.replace("private final RestTemplate restTemplate = new RestTemplate();", "private final RestTemplate restTemplate = new RestTemplate();\n" + repos)

# Add DB fetch logic
db_logic = """
        // Fetch DB data (Latest available)
        petroleumRepo.findAllByOrderByDateAsc().stream().reduce((first, second) -> second).ifPresent(p -> {
            Map<String, Object> pMap = new HashMap<>();
            pMap.put("date", p.getDate());
            pMap.put("gasoline", p.getGasolinePrice());
            pMap.put("diesel", p.getDieselPrice());
            pMap.put("kerosene", p.getKerosenePrice());
            result.put("petroleum", pMap);
        });
        
        kospiRepo.findAllByOrderByDateAsc().stream().reduce((first, second) -> second).ifPresent(k -> {
            Map<String, Object> kMap = new HashMap<>();
            kMap.put("date", k.getDate());
            kMap.put("kospi", k.getKospiIndex());
            kMap.put("kospi200", k.getKospi200Index());
            kMap.put("tradingValue", k.getTradingValue());
            result.put("kospi", kMap);
        });
"""

content = content.replace("return ResponseEntity.ok(result);", db_logic + "\n        return ResponseEntity.ok(result);")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("Updated GlobalMetricsController successfully.")
