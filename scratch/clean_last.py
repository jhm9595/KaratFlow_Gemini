import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace all instances of `?` with a placeholder, then fix the specific broken ones
# Actually, the simplest is just to search for any Korean-like corrupted string that has ? mixed with hangul

text = re.sub(r"주문 \?⑥\?\?\?꾨즺", "주문 취소 완료", text)
text = re.sub(r"\?\?닔\?\? \?\?\{", "수수료: ₩{", text)
text = re.sub(r"\?\?쪟", "오류", text)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Cleaned!')
