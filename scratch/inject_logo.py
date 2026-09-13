import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

pattern = r'<div className="w-2rem h-2rem bg-primary border-circle flex align-items-center justify-content-center shadow-1">\s*<i className="pi pi-chart-line text-white"></i>\s*</div>'
replacement = '<img src="/logo.png" alt="KaratFlow Logo" style={{ width: \'32px\', height: \'32px\' }} />'

content = re.sub(pattern, replacement, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Injected logo into App.tsx")
