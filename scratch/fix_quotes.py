import codecs

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace("style={{ minHeight: \\'180px\\' }}", "style={{ minHeight: '180px' }}")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Fixed quote escaping")
