import codecs

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/service/MockDataSeeder.java'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

import_statement = "import com.minibig.karatflow.backend.domain.DailyMetalPrice;\nimport com.minibig.karatflow.backend.repository.DailyMetalPriceRepository;\nimport java.time.LocalDate;"

if "DailyMetalPriceRepository" not in content:
    content = content.replace("import com.minibig.karatflow.backend.repository.OrderRepository;", "import com.minibig.karatflow.backend.repository.OrderRepository;\n" + import_statement)
    content = content.replace("private final OrderRepository orderRepository;", "private final OrderRepository orderRepository;\n    private final DailyMetalPriceRepository dailyMetalPriceRepository;")
    
    seed_gold = """
        if (dailyMetalPriceRepository.count() == 0) {
            log.info("Seeding mock gold prices...");
            double[] mockPrices = {442000, 445000, 443500, 448000, 451000, 453000, 455000};
            for (int i = 0; i < mockPrices.length; i++) {
                DailyMetalPrice price = new DailyMetalPrice();
                price.setMetalType("GOLD_24K");
                price.setPricePer375g(mockPrices[i]);
                price.setPriceDate(LocalDate.now().minusDays(mockPrices.length - 1 - i));
                dailyMetalPriceRepository.save(price);
            }
        }
    """
    content = content.replace("log.info(\"Mock orders seeded successfully!\");", "log.info(\"Mock orders seeded successfully!\");\n" + seed_gold)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("MockDataSeeder updated with mock gold prices.")
