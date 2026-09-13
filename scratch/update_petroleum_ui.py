import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Add a TabView for Global Metrics vs Energy
# First, import TabView and TabPanel
if "import { TabView, TabPanel }" not in content:
    content = content.replace("import { Timeline } from 'primereact/timeline';", "import { Timeline } from 'primereact/timeline';\nimport { TabView, TabPanel } from 'primereact/tabview';")

# Find the Global Metrics section:
# {/* Advanced Widget 3: 글로벌 지표 */}
# <div className="surface-0 p-3 border-round shadow-1 mt-3">
#     <h4 className="m-0 mb-3 text-600 font-medium">글로벌 지표 (현재가)</h4>

global_metrics_ui = """{/* Advanced Widget 3: 글로벌 지표 & 에너지 */}
                        <div className="surface-0 p-3 border-round shadow-1 mt-3">
                            <TabView>
                                <TabPanel header="글로벌 귀금속·환율">
                                    <div className="flex flex-column gap-2">
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600">백금 (Platinum)</span>
                                            <span className="font-bold text-700">{globalMetrics?.platinum?.price ? `$${globalMetrics.platinum.price.toFixed(2)}` : '로딩중...'}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600">구리 (Copper)</span>
                                            <span className="font-bold text-700">{globalMetrics?.copper?.price ? `$${globalMetrics.copper.price.toFixed(4)}` : '로딩중...'}</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600">달러 인덱스 (DXY)</span>
                                            <span className="font-bold text-700">{globalMetrics?.dxy?.price ? `${globalMetrics.dxy.price.toFixed(2)}` : '로딩중...'}</span>
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel header="석유·에너지 (KRX)">
                                    <div className="flex flex-column gap-2">
                                        <div className="text-sm text-500 mb-2">※ KRX 석유시장 일별매매 (업데이트 예정)</div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600">휘발유 (경쟁)</span>
                                            <span className="font-bold text-700">- ₩/L</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600">경유 (경쟁)</span>
                                            <span className="font-bold text-700">- ₩/L</span>
                                        </div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-600">등유 (경쟁)</span>
                                            <span className="font-bold text-700">- ₩/L</span>
                                        </div>
                                    </div>
                                </TabPanel>
                            </TabView>
                        </div>"""

# Find the block to replace
start_comment = r'\{\/\* Advanced Widget 3:.*?\*\/\}'
end_pattern = r'<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>' # This might be risky, let's just replace the exact widget div.

# Let's find exactly the block:
block_regex = r'\{\/\* Advanced Widget 3: 글로벌 지표 \*\/.*?<h4 className="m-0 mb-3 text-600 font-medium">글로벌 지표 \(현재가\)<\/h4>.*?<\/div>\s*<\/div>'

pattern = re.compile(block_regex, re.DOTALL)
if pattern.search(content):
    content = pattern.sub(global_metrics_ui, content, count=1)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print("Successfully added Petroleum Tab to Global Metrics UI.")
else:
    print("Could not find Global Metrics UI block in App.tsx.")
