import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace col-3 with responsive and flex classes
content = content.replace('<div className="col-3">', '<div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">')
# Remove the mt-1 from InputText and InputNumber since gap-2 handles the margin now
content = content.replace('className="w-full mt-1"', 'className="w-full"')

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed layout of subcontract modal")
