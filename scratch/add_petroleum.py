import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

if "import { TabView, TabPanel }" not in content:
    content = content.replace("import { Timeline } from 'primereact/timeline';", "import { Timeline } from 'primereact/timeline';\nimport { TabView, TabPanel } from 'primereact/tabview';")

# Find the end of the Gold Price widget to insert the Global Metrics widget
# The Gold Price widget ends with: </AreaChart>\n</ResponsiveContainer>\n</div>\n</div>
block_regex = r'(<\/AreaChart>\s*<\/ResponsiveContainer>\s*<\/div>\s*<\/div>)'

global_metrics_ui = """
                        {/* Advanced Widget 3: 글로벌 지표 & 에너지 */}
                        <div className="surface-0 p-3 border-round shadow-1 mt-3">
                            <TabView>
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
                        </div>
"""

pattern = re.compile(block_regex, re.DOTALL)
if pattern.search(content):
    content = pattern.sub(r'\1\n' + global_metrics_ui, content, count=1)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print("Successfully added Petroleum Widget.")
else:
    print("Could not find insertion point.")
