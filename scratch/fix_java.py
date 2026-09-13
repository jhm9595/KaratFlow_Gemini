import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/service/DailyMetalPriceScheduler.java'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Remove Jackson imports
content = re.sub(r"import com\.fasterxml\.jackson\.databind\.JsonNode;\n", "", content)
content = re.sub(r"import com\.fasterxml\.jackson\.databind\.ObjectMapper;\n", "", content)

# Replace fetchPriceFromApi
old_fetch = r"private double fetchPriceFromApi\(\) \{[\s\S]*\}\s*\}"

new_fetch = """private double fetchPriceFromApi() {
        if (goldApiKey == null || goldApiKey.trim().isEmpty()) {
            log.error("GOLD_API_KEY is not set in environment properties!");
            return -1;
        }

        try {
            String rawUri = "https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getGoldPriceInfo?serviceKey=" + goldApiKey + "&resultType=json&numOfRows=1&pageNo=1";
            log.info("Calling Gold API...");
            
            java.util.Map<String, Object> response = restTemplate.getForObject(new java.net.URI(rawUri), java.util.Map.class);
            
            if (response != null && response.containsKey("response")) {
                java.util.Map<String, Object> resBody = (java.util.Map<String, Object>) response.get("response");
                if (resBody != null && resBody.containsKey("body")) {
                    java.util.Map<String, Object> body = (java.util.Map<String, Object>) resBody.get("body");
                    if (body != null && body.containsKey("items")) {
                        java.util.Map<String, Object> itemsMap = (java.util.Map<String, Object>) body.get("items");
                        if (itemsMap != null && itemsMap.containsKey("item")) {
                            java.util.List<java.util.Map<String, Object>> itemList = (java.util.List<java.util.Map<String, Object>>) itemsMap.get("item");
                            if (itemList != null && !itemList.isEmpty()) {
                                java.util.Map<String, Object> firstItem = itemList.get(0);
                                String clprStr = String.valueOf(firstItem.get("clpr"));
                                double clpr = Double.parseDouble(clprStr); // Price per 1g
                                log.info("API returned 1g price: {} for item: {}", clpr, firstItem.get("itmsNm"));
                                
                                // Convert 1g price to 3.75g (1돈)
                                double price375 = clpr * 3.75;
                                return Math.round(price375);
                            }
                        }
                    }
                }
            }
            log.warn("API returned invalid or empty response structure");
            return -1;

        } catch (Exception e) {
            log.error("API Call failed: {}", e.getMessage(), e);
            return -1;
        }
    }
}"""

content = re.sub(old_fetch, new_fetch, content)
content = content.replace("private final ObjectMapper objectMapper = new ObjectMapper();", "")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("DailyMetalPriceScheduler.java fixed.")
