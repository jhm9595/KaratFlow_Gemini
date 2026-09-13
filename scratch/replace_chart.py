import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# 1. Replace the data array
old_data_regex = r"const dailySubcontractData = \[.*?\];"
new_data = """const goldPriceData = [
        { date: '08/28', price: 442000 },
        { date: '08/29', price: 445000 },
        { date: '08/30', price: 443500 },
        { date: '08/31', price: 448000 },
        { date: '09/01', price: 451000 },
        { date: '09/02', price: 453000 },
        { date: '09/03', price: 455000 }
    ];"""

content = re.sub(old_data_regex, new_data, content, flags=re.DOTALL)

# 2. Replace the chart rendering block
old_chart_regex = r"\{\/\* Advanced Chart 2: 외주 처리 현황 \*\/\}.*?<\/ResponsiveContainer>\s*<\/div>\s*<\/div>"

new_chart = """{/* Advanced Chart 2: 실시간 금 시세 */}
                        <div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">
                            <h4 className="m-0 mb-3 text-600 font-medium">최근 금 시세 추이 (24k 3.75g 기준)</h4>
                            <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={goldPriceData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis domain={['dataMin - 2000', 'dataMax + 2000']} tickFormatter={(val) => (val/10000) + '만'} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip formatter={(value) => ['₩' + value.toLocaleString(), '금 시세']} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Line type="monotone" dataKey="price" name="순금 시세(원)" stroke="#eab308" strokeWidth={3} dot={{r: 4, fill: '#ca8a04'}} activeDot={{r: 6}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>"""

content = re.sub(old_chart_regex, new_chart, content, flags=re.DOTALL)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("App.tsx successfully modified for gold price chart.")
