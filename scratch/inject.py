import codecs
with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

admin_btn = '<Button label="물건 관리" icon="pi pi-box" className="p-button-secondary p-button-sm shadow-1 mr-2" onClick={() => setProductAdminVisible(true)} />\n                                <Button label="새 주문 생성"'
text = text.replace('<Button label="새 주문 생성"', admin_btn)

admin_modal = '<ProductAdminModal visible={productAdminVisible} onHide={() => setProductAdminVisible(false)} toast={toast} getAuthHeaders={getAuthHeaders} />'

text = text.replace('</Dialog>\n            </div>\n        </div>\n    );\n}', '</Dialog>\n                ' + admin_modal + '\n            </div>\n        </div>\n    );\n}')

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)
