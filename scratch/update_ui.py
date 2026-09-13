import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# First, ensure AreaChart, Area, defs, linearGradient, stop are imported from recharts
if "AreaChart" not in content:
    content = content.replace("LineChart, Line, ", "LineChart, Line, AreaChart, Area, ")

# Next, we're going to extract the two blocks in the grid: 
# <div className="col-12 lg:col-6"> (Pipeline)
# <div className="col-12 lg:col-6"> (Chart)
# We will split them into two separate full-width rows.

# We need to find the entire block of the dashboard grid.
# The structure is:
# <div className="grid">
#   {/* Row 1: KPI */} ...
#   {/* Pipeline */} ...
#   {/* Chart */} ...
# </div>

# We will calculate today's prices based on goldPriceData
calc_code = """
    // Gold Price Calculations
    const todayGold = goldPriceData.length > 0 ? goldPriceData[goldPriceData.length - 1] : { price24k: 0, price18k: 0, price14k: 0 };
    const yesterdayGold = goldPriceData.length > 1 ? goldPriceData[goldPriceData.length - 2] : todayGold;
    
    const delta24k = todayGold.price24k - yesterdayGold.price24k;
    const delta18k = todayGold.price18k - yesterdayGold.price18k;
    const delta14k = todayGold.price14k - yesterdayGold.price14k;
"""

if "// Gold Price Calculations" not in content:
    content = content.replace("return (", calc_code + "\n    return (")

new_chart_html = """
                    {/* Advanced Chart 2: 실시간 금 시세 (Full Width) */}
                    <div className="col-12">
                        <div className="surface-0 p-4 border-round shadow-1">
                            <div className="flex justify-content-between align-items-center mb-4">
                                <h4 className="m-0 text-700 font-medium text-xl">
                                    <i className="pi pi-chart-line mr-2 text-yellow-500"></i>국내 금 시세 종합 (3.75g 기준)
                                </h4>
                            </div>
                            
                            {/* Current Price Highlights */}
                            <div className="grid mb-4">
                                <div className="col-12 md:col-4">
                                    <div className="surface-50 p-3 border-round border-1 border-yellow-200">
                                        <span className="text-500 font-medium block mb-2">24K 순금</span>
                                        <div className="text-900 font-bold text-2xl">₩{todayGold.price24k.toLocaleString()}</div>
                                        <span className={`text-sm ${delta24k > 0 ? 'text-red-500' : delta24k < 0 ? 'text-blue-500' : 'text-500'}`}>
                                            {delta24k > 0 ? '▲' : delta24k < 0 ? '▼' : '-'} {Math.abs(delta24k).toLocaleString()} (전일대비)
                                        </span>
                                    </div>
                                </div>
                                <div className="col-12 md:col-4">
                                    <div className="surface-50 p-3 border-round border-1 border-orange-200">
                                        <span className="text-500 font-medium block mb-2">18K</span>
                                        <div className="text-900 font-bold text-2xl">₩{todayGold.price18k.toLocaleString()}</div>
                                        <span className={`text-sm ${delta18k > 0 ? 'text-red-500' : delta18k < 0 ? 'text-blue-500' : 'text-500'}`}>
                                            {delta18k > 0 ? '▲' : delta18k < 0 ? '▼' : '-'} {Math.abs(delta18k).toLocaleString()} (전일대비)
                                        </span>
                                    </div>
                                </div>
                                <div className="col-12 md:col-4">
                                    <div className="surface-50 p-3 border-round border-1 border-purple-200">
                                        <span className="text-500 font-medium block mb-2">14K</span>
                                        <div className="text-900 font-bold text-2xl">₩{todayGold.price14k.toLocaleString()}</div>
                                        <span className={`text-sm ${delta14k > 0 ? 'text-red-500' : delta14k < 0 ? 'text-blue-500' : 'text-500'}`}>
                                            {delta14k > 0 ? '▲' : delta14k < 0 ? '▼' : '-'} {Math.abs(delta14k).toLocaleString()} (전일대비)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Multi-Area Chart */}
                            <div style={{ minHeight: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={goldPriceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="color24k" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="color18k" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="color14k" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis domain={['dataMin - 10000', 'dataMax + 10000']} tickFormatter={(val) => (val/10000) + '만'} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip 
                                            formatter={(value: any, name: string) => ['₩' + (value || 0).toLocaleString(), name]} 
                                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#333' }} 
                                        />
                                        <Legend wrapperStyle={{ fontSize: '14px', marginTop: '10px' }} iconType="circle" />
                                        <Area type="monotone" dataKey="price24k" name="24K 순금" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#color24k)" activeDot={{r: 6}} />
                                        <Area type="monotone" dataKey="price18k" name="18K" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#color18k)" activeDot={{r: 6}} />
                                        <Area type="monotone" dataKey="price14k" name="14K" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#color14k)" activeDot={{r: 6}} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
"""

# Find the Pipeline div and Chart div
pipeline_regex = r"\{\/\* Pipeline Visualization \*\/\}\s*<div className=\"col-12 lg:col-6\">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>"
chart_regex = r"\{\/\* Advanced Chart 2: 실시간 금 시세 \*\/\}\s*<div className=\"col-12 lg:col-6\">\s*<div className=\"surface-0 p-3 border-round shadow-1 flex-1 flex flex-column\">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>"

# We want to replace `<div className="col-12 lg:col-6">` of the pipeline with `<div className="col-12">`
pipeline_block = re.search(pipeline_regex, content)
if pipeline_block:
    pipeline_str = pipeline_block.group(0)
    pipeline_str_full = pipeline_str.replace('<div className="col-12 lg:col-6">', '<div className="col-12">')
    
    # Remove old chart and pipeline
    content = re.sub(chart_regex, "", content)
    content = content.replace(pipeline_str, new_chart_html + "\n" + pipeline_str_full)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("App.tsx updated with new composed chart layout.")
