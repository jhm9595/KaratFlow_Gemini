import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# We need to extract the exact block for "Advanced Chart 1: 병목 분석"
# and replace the broken header/cards/button with the correct ones.

pattern = r"""(                        \{/\* Advanced Chart 1: 병목 분석 \*/\}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">)
                            <div className="flex justify-content-between align-items-center mb-3">
                                <h4 className="m-0 text-600 font-medium">오늘의 금 시세 \(3.75g 기준\)</h4>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">24K \(순금\)</div>
                                    <div className="font-bold text-yellow-600">₩\{todayGold\.price24k\.toLocaleString\(\)\} \{renderDelta\(delta24k\)\}</div>
                                </div>
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">18K</div>
                                    <div className="font-bold text-orange-500">₩\{todayGold\.price18k\.toLocaleString\(\)\} \{renderDelta\(delta18k\)\}</div>
                                </div>
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">14K</div>
                                    <div className="font-bold text-purple-500">₩\{todayGold\.price14k\.toLocaleString\(\)\} \{renderDelta\(delta14k\)\}</div>
                                </div>
                            </div>

                            <div className="flex-1 w-full" style=\{\{ minHeight: '180px' \}\}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data=\{dailyProcessData\} margin=\{\{ top: 5, right: 5, left: -20, bottom: 5 \}\}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical=\{false\} />
                                        <XAxis dataKey="date" tick=\{\{fontSize: 12, fill: '#6b7280'\}\} axisLine=\{false\} tickLine=\{false\} />
                                        <YAxis tick=\{\{fontSize: 12, fill: '#6b7280'\}\} axisLine=\{false\} tickLine=\{false\} />
                                        <RechartsTooltip contentStyle=\{\{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' \}\} />
                                        <Legend wrapperStyle=\{\{ fontSize: '12px' \}\} />
                                        <Bar dataKey="CAD" stackId="a" fill="#8884d8" name="CAD" />
                                        <Bar dataKey="주물" stackId="a" fill="#82ca9d" name="주물" />
                                        <Bar dataKey="세공" stackId="a" fill="#ffc658" name="세공" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                                <div className="flex justify-content-end mt-2">
                                    <Button label="금 시세 심층 도구 및 계산기" className="p-button-outlined p-button-sm p-button-warning" icon="pi pi-calculator" onClick=\{\(\) => setGoldToolsVisible\(true\)\} />
                                </div>
                        </div>"""

replacement = """\\1
                            <h4 className="m-0 mb-3 text-600 font-medium">작업장 공정 트렌드 현황 (주간)</h4>
                            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyProcessData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="CAD" stackId="a" fill="#8884d8" name="CAD" />
                                        <Bar dataKey="주물" stackId="a" fill="#82ca9d" name="주물" />
                                        <Bar dataKey="세공" stackId="a" fill="#ffc658" name="세공" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>"""

# Ensure encoding is matched exactly as the file (e.g. 세공 might be broken in the string but I'll try normal replacement)
# Because powershell might have output broken characters like ?공, I'll use a safer regex approach

content_re = re.compile(
    r'(                        \{/\* Advanced Chart 1: 병목 분석 \*/\}\s*'
    r'<div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">)\s*'
    r'<div className="flex justify-content-between align-items-center mb-3">.*?<BarChart',
    re.DOTALL
)

content = content_re.sub(
    r'\1\n                            <h4 className="m-0 mb-3 text-600 font-medium">작업장 공정 트렌드 현황 (주간)</h4>\n                            <div className="flex-1 w-full" style={{ minHeight: \'180px\' }}>\n                                <ResponsiveContainer width="100%" height="100%">\n                                    <BarChart', 
    content
)

content_re2 = re.compile(
    r'(<Bar dataKey="세공" stackId="a" fill="#ffc658" name="세공" />\s*</BarChart>\s*</ResponsiveContainer>\s*</div>)\s*<div className="flex justify-content-end mt-2">\s*<Button label="[^"]+" className="p-button-outlined p-button-sm p-button-warning" icon="pi pi-calculator" onClick=\{\(\) => setGoldToolsVisible\(true\)\} />\s*</div>',
    re.DOTALL
)

content = content_re2.sub(r'\1', content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Fixed Chart 1 (Bottleneck)")
