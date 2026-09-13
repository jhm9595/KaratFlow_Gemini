import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/service/DailyMetalPriceScheduler.java'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Add @PostConstruct to fetchDailyMetalPrice
if "@PostConstruct" not in content:
    content = content.replace("import org.springframework.scheduling.annotation.Scheduled;", "import org.springframework.scheduling.annotation.Scheduled;\nimport jakarta.annotation.PostConstruct;")
    content = content.replace("@Scheduled(cron = \"0 30 10 * * ?\")", "@PostConstruct\n    @Scheduled(cron = \"0 30 10 * * ?\")")

    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)

print("Added @PostConstruct to fetch initial data.")
