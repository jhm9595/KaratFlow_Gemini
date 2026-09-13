import codecs
with codecs.open('frontend/src/main.tsx', 'r', 'utf-8') as f:
    text = f.read()

if 'ProductAdmin' not in text:
    text = text.replace("import { ProductStats } from './pages/ProductStats'", "import { ProductStats } from './pages/ProductStats'\nimport { ProductAdmin } from './pages/ProductAdmin'")
    text = text.replace("<Route path=\"/stats\" element={<ProductStats />} />", "<Route path=\"/stats\" element={<ProductStats />} />\n          <Route path=\"/products\" element={<ProductAdmin />} />")
    with codecs.open('frontend/src/main.tsx', 'w', 'utf-8') as f:
        f.write(text)
