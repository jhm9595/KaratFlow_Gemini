import codecs

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Replace <Tooltip with <RechartsTooltip in the specific line
content = content.replace("<Tooltip formatter={(value)", "<RechartsTooltip formatter={(value)")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Fixed Tooltip reference in App.tsx")
