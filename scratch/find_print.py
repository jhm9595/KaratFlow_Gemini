with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
import re
match = re.search(r'<Button label=.*?"pi pi-print".*?/>', text, re.DOTALL)
if match:
    # get context around match
    start = max(0, text.rfind('<Dialog header="주문 상세 정보"', 0, match.start()))
    end = text.find('</Dialog>', match.end()) + 9
    print(text[start:end])
