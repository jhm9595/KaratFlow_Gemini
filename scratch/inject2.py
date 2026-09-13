import codecs
with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

admin_btn = '<Button label="물건 관리" icon="pi pi-box" className="p-button-secondary p-button-sm shadow-1 mr-2" onClick={() => setProductAdminVisible(true)} />\n                                <Button '
text = text.replace('<Button label="새 주문 생성"', admin_btn + 'label="새 주문 생성"')
text = text.replace('<Button label=" ֹ "', admin_btn + 'label=" ֹ "')

# also fix the type error
text = text.replace('quantity: e.value || 1', 'quantity: (e.value as number) || 1')

# also try to append the modal at the very end of the main div
if "<ProductAdminModal" not in text:
    parts = text.rsplit('</div>', 2)
    if len(parts) == 3:
        text = parts[0] + '<ProductAdminModal visible={productAdminVisible} onHide={() => setProductAdminVisible(false)} toast={toast} getAuthHeaders={getAuthHeaders} />\n</div>' + parts[1] + '</div>' + parts[2]

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)
