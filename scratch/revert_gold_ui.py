import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# The old Gold Price UI HTML with 3 lines
old_gold_ui = """{/* Advanced Chart 2: 오늘의 금 시세 */}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <h4 className="m-0 text-600 font-medium">오늘의 금 시세 (3.75g 기준)</h4>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">24K (순금)</div>
                                    <div className="font-bold text-yellow-600 text-lg">₩{todayGold.price24k.toLocaleString()}</div>
                                    <div className="mt-1">{renderDelta(delta24k)}</div>
                                </div>
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">18K</div>
                                    <div className="font-bold text-orange-500 text-lg">₩{todayGold.price18k.toLocaleString()}</div>
                                    <div className="mt-1">{renderDelta(delta18k)}</div>
                                </div>
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">14K</div>
                                    <div className="font-bold text-purple-500 text-lg">₩{todayGold.price14k.toLocaleString()}</div>
                                    <div className="mt-1">{renderDelta(delta14k)}</div>
                                </div>
                            </div>

                            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={goldPriceData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="color24k" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="color18k" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="color14k" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} tickFormatter={(val) => (val/10000) + '만'} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} formatter={(value) => `₩${value.toLocaleString()}`} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="price24k" name="24K" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#color24k)" />
                                        <Area type="monotone" dataKey="price18k" name="18K" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#color18k)" />
                                        <Area type="monotone" dataKey="price14k" name="14K" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#color14k)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>"""

# Find the block to replace
start_comment = r'\{\/\* Advanced Chart 2:.*?\*\/\}'
end_pattern = r'<\/AreaChart>\s*<\/ResponsiveContainer>\s*<\/div>'

pattern = re.compile(start_comment + r'.*?' + end_pattern, re.DOTALL)

if pattern.search(content):
    content = pattern.sub(old_gold_ui, content)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print("Successfully reverted Gold Price UI.")
else:
    print("Could not find the target UI block in App.tsx.")
