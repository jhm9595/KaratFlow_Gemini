import codecs
import re

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace("import { ProductAdminModal } from './components/ProductAdminModal';", "")
text = re.sub(r'const \[productAdminVisible, setProductAdminVisible\] = useState\(false\);\n\s*', '', text)
text = text.replace("onClick={() => setProductAdminVisible(true)}", "onClick={() => navigate('/products')}")
text = text.replace("<ProductAdminModal visible={productAdminVisible} onHide={() => setProductAdminVisible(false)} toast={toast} getAuthHeaders={getAuthHeaders} />", "")

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)
