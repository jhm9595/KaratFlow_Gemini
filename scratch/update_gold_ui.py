import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# I want to add Volume and Value info right below the delta of the 24K box.
# Let's add a new section below the 3 boxes, or inside the 24K box.
# It makes more sense to add it below the 3 boxes as a unified "Trading Info" row.
# Or inside the 24K box. Let's look for the flex gap-2 row.
# The user asked: "추가로 현재 금 시세만 보여줄게 아니라, 거래량, 거래대금도 추가로 가독성 좋게 보여주면 좋겠다."
# I will append a new row below the 3 price boxes, displaying Volume and Value.

new_row = """
                            {/* 거래량 & 거래대금 */}
                            <div className="flex gap-2 mb-3">
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">오늘 거래량 (1g 단위)</div>
                                    <div className="font-bold text-700">{todayGold.volume ? todayGold.volume.toLocaleString() + 'g' : '-'}</div>
                                </div>
                                <div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
                                    <div className="text-xs text-600 mb-1">오늘 거래대금</div>
                                    <div className="font-bold text-700">{todayGold.value ? '₩' + (todayGold.value / 100000000).toLocaleString(undefined, {maximumFractionDigits: 1}) + '억' : '-'}</div>
                                </div>
                            </div>
"""

# Find where the 3 price boxes end:
# </div>
# <div className="flex-1 w-full" style={{ minHeight: '180px' }}>
pattern = re.compile(r'(</div>)\s*(<div className="flex-1 w-full" style=\{\{ minHeight: \'180px\' \}\}>)')

if pattern.search(content):
    content = pattern.sub(r'\1\n' + new_row + r'\2', content, count=1)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print("Successfully added volume and value to Gold UI.")
else:
    print("Could not find insertion point in App.tsx.")
