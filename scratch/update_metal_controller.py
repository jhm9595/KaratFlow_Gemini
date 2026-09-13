import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/web/MetalPriceController.java'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

new_logic = """
        List<Map<String, Object>> response = recent.stream()
                .sorted((a, b) -> a.getPriceDate().compareTo(b.getPriceDate())) // Ascending order
                .map(price -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("date", price.getPriceDate().format(DateTimeFormatter.ofPattern("MM/dd")));
                    
                    double p24 = price.getPricePer375g();
                    double p18 = Math.round((p24 * 0.825) / 100) * 100;
                    double p14 = Math.round((p24 * 0.6435) / 100) * 100;

                    map.put("price24k", p24);
                    map.put("price18k", p18);
                    map.put("price14k", p14);
                    return map;
                })
                .collect(Collectors.toList());
"""

old_logic = r"List<Map<String, Object>> response = recent\.stream\(\)[\s\S]*?\.collect\(Collectors\.toList\(\)\);"

content = re.sub(old_logic, new_logic.strip(), content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("MetalPriceController.java updated for 14k/18k.")
