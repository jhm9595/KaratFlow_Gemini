import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r'surface-900', 'surface-100'),
    (r'surface-800', 'surface-0'),
    (r'surface-700', 'surface-50'),
    (r'text-gray-100', 'text-gray-900'),
    (r'text-white', 'text-900'),
    (r'text-gray-400', 'text-600'),
    (r'text-gray-300', 'text-700'),
    (r"backgroundColor: '#1f2937'", "backgroundColor: '#ffffff'"),
    (r"color: '#fff'", "color: '#333'"),
    (r"bg-gray-800 text-white", "surface-0 text-900"),
    (r"border-gray-700", "border-300"),
    (r"bg-gray-700", "surface-200")
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Converted to Light Mode")
