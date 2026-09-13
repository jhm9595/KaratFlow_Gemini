import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

pattern = r'<div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">\s*<div className="text-xs text-600 mb-1">24K \(순금\)</div>\s*<div className="font-bold text-yellow-600">₩\{todayGold\.price24k\.toLocaleString\(\)\}\s*\{renderDelta\(delta24k\)\}</div>\s*</div>\s*<div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">\s*<div className="text-xs text-600 mb-1">18K</div>\s*<div className="font-bold text-orange-500">₩\{todayGold\.price18k\.toLocaleString\(\)\}\s*\{renderDelta\(delta18k\)\}</div>\s*</div>\s*<div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">\s*<div className="text-xs text-600 mb-1">14K</div>\s*<div className="font-bold text-purple-500">₩\{todayGold\.price14k\.toLocaleString\(\)\}\s*\{renderDelta\(delta14k\)\}</div>\s*</div>'

replacement = """<div className="flex-1 surface-50 p-2 border-round text-center border-1 border-300">
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
                                </div>"""

content = re.sub(pattern, replacement, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Updated delta layout")
