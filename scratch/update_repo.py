import codecs

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/repository/DailyMetalPriceRepository.java'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

if "findTop7" not in content:
    content = content.replace("}", "    java.util.List<DailyMetalPrice> findTop7ByMetalTypeOrderByPriceDateDesc(String metalType);\n}")
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)

print("Repository updated.")
