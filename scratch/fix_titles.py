import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<h4 className="m-0 mb-3 text-600 font-medium">실시간 주요 지표</h4>', '<h4 className="m-0 mb-3 text-600 font-medium">실시간 핵심 지표</h4>')
text = text.replace('<h4 className="m-0 mb-3 text-600 font-medium">실시간 공정 흐름 및 바틀넥</h4>', '<h4 className="m-0 mb-4 text-600 font-medium">실시간 공정 현황 (Pipeline)</h4>')

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Titles fixed!")
