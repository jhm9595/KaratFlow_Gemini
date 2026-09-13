import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("{ 'Content-Type': 'application/json', ...getAuthHeaders() }", "getAuthHeaders()")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("TS error fixed!")
