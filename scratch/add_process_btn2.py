import codecs

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

target = 'onClick={openHandshakeModal} />'
replacement = 'onClick={openHandshakeModal} />\n                        <Button label="공정 관리" icon="pi pi-sitemap" className="p-button-outlined p-button-help p-button-sm" onClick={() => setProcessManagerVisible(true)} tooltip="공장 공정 단계를 커스터마이징합니다" tooltipOptions={{position: "bottom"}} />'

content = content.replace(target, replacement)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Added button.")
