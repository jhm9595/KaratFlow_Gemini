import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# 1. Replace the hardcoded array with a state variable
old_array = r"const goldPriceData = \[\s*\{ date: '08/28', price: 442000 \},[\s\S]*?\];"
new_state = "const [goldPriceData, setGoldPriceData] = useState<any[]>([]);"
content = re.sub(old_array, new_state, content)

# 2. Add fetch logic inside useEffect
# Find fetchOrders(); inside useEffect
use_effect_pattern = r"fetchOrders\(\);\s*const client = new Client\(\{"
new_fetch_logic = """fetchOrders();
        
        fetch('http://localhost:8888/api/metal-prices/recent', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => setGoldPriceData(data))
            .catch(err => console.error('Failed to fetch metal prices', err));

        const client = new Client({"""
content = content.replace("fetchOrders();\n\n        const client = new Client({", new_fetch_logic)
content = content.replace("fetchOrders();\r\n\r\n        const client = new Client({", new_fetch_logic)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("App.tsx modified to fetch live gold prices.")
