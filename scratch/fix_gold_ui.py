import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# 1. Clean up the messy variables from `customizedMarker`
cleanup_pattern = r'// Gold Price Calculations\s*const todayGold = .*?;\s*const yesterdayGold = .*?;\s*const delta24k = .*?;\s*const delta18k = .*?;\s*const delta14k = .*?;\s*'
content = re.sub(cleanup_pattern, '', content)

# 2. Add the variables to the main App component, right before the return statement.
app_return_pattern = r'const \[goldPriceData, setGoldPriceData\] = useState<any\[\]>\(\[\]\);\s*return \('

gold_vars = """
    // --- Gold Price Display Logic ---
    const todayGold = goldPriceData.length > 0 ? goldPriceData[goldPriceData.length - 1] : { price24k: 0, price18k: 0, price14k: 0 };
    const yesterdayGold = goldPriceData.length > 1 ? goldPriceData[goldPriceData.length - 2] : todayGold;
    
    const delta24k = todayGold.price24k - yesterdayGold.price24k;
    const delta18k = todayGold.price18k - yesterdayGold.price18k;
    const delta14k = todayGold.price14k - yesterdayGold.price14k;

    const renderDelta = (delta: number) => {
        if (delta > 0) return <span className="text-red-500 text-sm font-bold ml-2">▲ {delta.toLocaleString()}</span>;
        if (delta < 0) return <span className="text-blue-500 text-sm font-bold ml-2">▼ {Math.abs(delta).toLocaleString()}</span>;
        return <span className="text-600 text-sm font-bold ml-2">-</span>;
    };
    // ---------------------------------

    const [goldPriceData, setGoldPriceData] = useState<any[]>([]);
    return ("""

content = re.sub(app_return_pattern, gold_vars, content)

# 3. Add the 3 cards above the AreaChart
chart_container_pattern = r'<h4 className="m-0 mb-3 text-600 font-medium">최근 \?\?세 추이 \(24k 3\.75g 기\?\)</h4>'
# Korean characters are messy in regex sometimes, so I'll match the div before it.
div_pattern = r'(<div className="surface-0 p-3 border-round shadow-1 flex-1 flex flex-column">)\s*<h4 className="m-0 mb-3 text-600 font-medium">.*?</h4>'

cards_ui = r"""\1
                            <div className="flex justify-content-between align-items-center mb-3">
                                <h4 className="m-0 text-600 font-medium">오늘의 금 시세 (3.75g 기준)</h4>
                            </div>
                            <div className="flex gap-2 mb-3">
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">24K (순금)</div>
                                    <div className="font-bold text-yellow-600">₩{todayGold.price24k.toLocaleString()} {renderDelta(delta24k)}</div>
                                </div>
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">18K</div>
                                    <div className="font-bold text-orange-500">₩{todayGold.price18k.toLocaleString()} {renderDelta(delta18k)}</div>
                                </div>
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">14K</div>
                                    <div className="font-bold text-purple-500">₩{todayGold.price14k.toLocaleString()} {renderDelta(delta14k)}</div>
                                </div>
                            </div>
"""

content = re.sub(div_pattern, cards_ui, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Fixed gold UI logic in App.tsx")
