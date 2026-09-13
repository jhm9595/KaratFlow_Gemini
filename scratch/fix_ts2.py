import codecs
with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace('const [productAdminVisible, setProductAdminVisible] = useState(false);', '')

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)

with codecs.open('frontend/src/pages/ProductAdmin.tsx', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace("return token ? { 'Authorization': `Bearer ${token}` } : {};", "return token ? { 'Authorization': `Bearer ${token}` } as any : {} as any;")

with codecs.open('frontend/src/pages/ProductAdmin.tsx', 'w', 'utf-8') as f:
    f.write(text)
