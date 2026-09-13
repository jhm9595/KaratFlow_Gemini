import codecs
with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

text = text.replace("import i18n from './i18n';", "")

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)
