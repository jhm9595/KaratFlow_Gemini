import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace corrupted Korean text with proper words
# From what we know:
# ?수 -> 접수
# 주물 is sometimes corrupted, sometimes not. Let's see: '?ֹ' or '주물'
# ?공 -> 세공
# ?성 -> 완성

text = text.replace('수', '접수')
text = text.replace('ֹ', '주물')
text = text.replace('공', '세공')
text = text.replace('성', '완성')

# Also fix the array directly
text = text.replace("['', 'CAD', 'ֹ', '', 'ϼ']", "['접수', 'CAD', '주물', '세공', '완성']")

# Wait, let's just make it completely bulletproof using regex on the corrupted fragments
replacements = [
    (r'\b\S*수\b', '접수'),
    (r'\b\S*공\b', '세공'),
    (r'\b\S*성\b', '완성'),
    (r'\b\S*ֹ\S*\b', '주물'),
    (r'', '접수'),  # some are just 
    (r'ϼ', '완성')
]

# Let's inspect the file first before regexing blindly
with open('scratch/App_inspect.txt', 'w', encoding='utf-8') as f:
    f.write(text)

