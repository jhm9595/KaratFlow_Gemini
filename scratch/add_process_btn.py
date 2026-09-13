import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

pattern = r'(<Button label="?력\?\?초\?\?" icon="pi pi-users" className="p-button-outlined p-button-info p-button-sm" onClick=\{openHandshakeModal\} />)'

new_btn = r'\1\n                        <Button label="공정 관리" icon="pi pi-sitemap" className="p-button-outlined p-button-help p-button-sm" onClick={() => setProcessManagerVisible(true)} tooltip="공장 공정 단계를 커스터마이징합니다" tooltipOptions={{position: "bottom"}} />'

content = re.sub(pattern, new_btn, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Added Process Manager button to header")
