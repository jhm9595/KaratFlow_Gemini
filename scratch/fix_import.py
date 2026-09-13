import codecs

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace("import { FileUpload } from 'primereact/fileupload';\n", "")
text = text.replace('// @ts-ignore\r\n    const [filteredProducts', 'const [filteredProducts')
text = text.replace('// @ts-ignore\n    const [filteredProducts', 'const [filteredProducts')

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)
