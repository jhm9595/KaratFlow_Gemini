import re

with open('frontend/src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'@media\s*\(prefers-color-scheme:\s*dark\)\s*\{.*?\}\s*\}', '', content, flags=re.DOTALL)
content = content.replace('color-scheme: light dark;', 'color-scheme: light;')

with open('frontend/src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("Forced Light Mode in index.css")
