import codecs
import re

file_path = 'frontend/src/pages/Login.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

pattern = r'<Card title="KaratFlow 로그인" className="w-full md:w-4 shadow-5 text-center">'
replacement = '<Card title={<div className="flex align-items-center justify-content-center gap-2"><img src="/logo.png" style={{width:\'40px\', height:\'40px\'}} /> KaratFlow 로그인</div>} className="w-full md:w-4 shadow-5 text-center">'

content = re.sub(pattern, replacement, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Injected logo into Login.tsx")
