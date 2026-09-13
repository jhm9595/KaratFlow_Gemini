import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Add imports
imports = """import GoldWidget from './components/widgets/GoldWidget';
import GlobalMetricsWidget from './components/widgets/GlobalMetricsWidget';
"""
if "import GoldWidget" not in content:
    content = content.replace("import { Timeline } from 'primereact/timeline';", "import { Timeline } from 'primereact/timeline';\n" + imports)

# Replace GoldWidget block
# Since we know it starts with `{/* Advanced Chart 2: 오늘의 금 시세 */}` and ends before `<div className="flex justify-content-end mt-2">`
gold_widget_replacement = """
                        {/* Advanced Chart 2: 오늘의 금 시세 */}
                        <GoldWidget 
                            todayGold={todayGold} 
                            yesterdayGold={yesterdayGold} 
                            delta24k={delta24k} 
                            delta18k={delta18k} 
                            delta14k={delta14k} 
                            goldPriceData={goldPriceData} 
                        />
"""

content = re.sub(r'\{\/\* Advanced Chart 2: 오늘의 금 시세 \*\/.*?<\/AreaChart>\s*<\/ResponsiveContainer>\s*<\/div>\s*<\/div>', gold_widget_replacement, content, flags=re.DOTALL)

# Replace GlobalMetrics block
# It starts with `{/* Advanced Widget 3: 글로벌 지표` and ends with `</TabView>\n</div>`
global_metrics_replacement = """
                        {/* Advanced Widget 3: 글로벌 지표 & 에너지 & 증시 */}
                        <GlobalMetricsWidget globalMetrics={globalMetrics} />
"""

content = re.sub(r'\{\/\* Advanced Widget 3:.*?\*\/.*?<\/TabView>\s*<\/div>', global_metrics_replacement, content, flags=re.DOTALL)
# Wait, if TabView isn't there (because maybe my previous injection failed, though it succeeded), let me just replace the exact div block.
# Actually, let's just make it simpler.
with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("Updated App.tsx with widgets!")
