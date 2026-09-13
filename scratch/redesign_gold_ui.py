import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# 1. New Gold Price UI HTML
new_gold_ui = """{/* Advanced Chart 2: 오늘의 금 시세 */}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <h4 className="m-0 text-700 font-medium">오늘의 금 시세 (3.75g 기준)</h4>
                            </div>
                            
                            {/* 24K 강조 (Hero) */}
                            <div className="flex align-items-end gap-3 mb-3">
                                <div>
                                    <div className="text-sm text-600 mb-1 font-medium">24K (순금)</div>
                                    <div className="font-bold text-yellow-600" style={{ fontSize: '2rem', lineHeight: '1' }}>
                                        ₩{todayGold.price24k.toLocaleString()}
                                    </div>
                                </div>
                                <div className="mb-1">
                                    {renderDelta(delta24k)}
                                </div>
                            </div>

                            {/* 18K, 14K 보조 정보 (Sub) */}
                            <div className="flex gap-3 mb-3 surface-50 p-2 border-round border-1 border-200">
                                <div className="flex-1 flex justify-content-between align-items-center border-right-1 border-300 pr-3">
                                    <span className="text-sm text-600 font-medium">18K</span>
                                    <div className="text-right">
                                        <div className="font-bold text-700">₩{todayGold.price18k.toLocaleString()}</div>
                                        <div style={{ transform: 'scale(0.85)', transformOrigin: 'right top' }}>{renderDelta(delta18k)}</div>
                                    </div>
                                </div>
                                <div className="flex-1 flex justify-content-between align-items-center pl-1">
                                    <span className="text-sm text-600 font-medium">14K</span>
                                    <div className="text-right">
                                        <div className="font-bold text-700">₩{todayGold.price14k.toLocaleString()}</div>
                                        <div style={{ transform: 'scale(0.85)', transformOrigin: 'right top' }}>{renderDelta(delta14k)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 간결해진 차트 (24K 트렌드만 표시) */}
                            <div className="flex-1 w-full" style={{ minHeight: '140px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={goldPriceData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="color24k" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#6b7280'}} tickFormatter={(value) => (value/10000) + '만'} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => `₩${value.toLocaleString()}`} labelStyle={{ color: '#374151' }} />
                                        <Area type="monotone" dataKey="price24k" name="24K 시세" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#color24k)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>"""

# Find the block to replace
start_comment = r'\{\/\* Advanced Chart 2:.*?\*\/\}'
# Find where the AreaChart ends
end_pattern = r'<\/AreaChart>\s*<\/ResponsiveContainer>\s*<\/div>'

pattern = re.compile(start_comment + r'.*?' + end_pattern, re.DOTALL)

if pattern.search(content):
    content = pattern.sub(new_gold_ui, content)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print("Successfully replaced Gold Price UI.")
else:
    print("Could not find the target UI block in App.tsx.")
