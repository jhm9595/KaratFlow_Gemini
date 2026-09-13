import codecs

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Fix the TS error
content = content.replace(
    "formatter={(value) => ['₩' + value.toLocaleString(), '금 시세']}",
    "formatter={(value: any) => ['₩' + (value || 0).toLocaleString(), '금 시세']}"
)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("TS error fixed.")
