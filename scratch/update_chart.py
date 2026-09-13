import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Pattern to find the existing LineChart block
chart_pattern = r'<LineChart data=\{goldPriceData\}[\s\S]*?</LineChart>'

new_chart = """<AreaChart data={goldPriceData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
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
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis domain={['dataMin - 10000', 'dataMax + 10000']} tickFormatter={(val) => (val/10000) + '만'} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip formatter={(value) => ['₩' + (value || 0).toLocaleString(), '']} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="price24k" name="24K (순금)" stroke="#eab308" fillOpacity={1} fill="url(#color24k)" />
                                        <Area type="monotone" dataKey="price18k" name="18K" stroke="#f97316" fillOpacity={1} fill="url(#color18k)" />
                                        <Area type="monotone" dataKey="price14k" name="14K" stroke="#8b5cf6" fillOpacity={1} fill="url(#color14k)" />
                                    </AreaChart>"""

content = re.sub(chart_pattern, new_chart, content)

# Also fix the RecentGoldPrices prop if it's wrong in GoldToolsModal
content = content.replace("recentPrices={recentGoldPrices}", "recentPrices={goldPriceData}")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("Updated chart to AreaChart with 24K, 18K, 14K")
