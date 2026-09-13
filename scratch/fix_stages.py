import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the map array and stageMap which is what's breaking the pipeline counts!
text = text.replace("['\ufffd\ufffd\ufffd\ufffd', 'CAD', '\ufffd\ufffd\u05b0\ufffd\ufffd', '\ufffd\ufffd\ufffd\ufffd', '\ufffd\ufffd\u03fc\ufffd\ufffd']", "['접수', 'CAD', '주물', '세공', '완성']")

# Fix stageMap keys and labels
text = text.replace("'\ufffd\ufffd\ufffd\ufffd': { label: '\ufffd\ufffd\ufffd\ufffd'", "'접수': { label: '접수'")
text = text.replace("'\ufffd\ufffd\u05b0\ufffd\ufffd': { label: '\ufffd\ufffd\u05b0\ufffd\ufffd'", "'주물': { label: '주물'")
text = text.replace("'\ufffd\ufffd\ufffd\ufffd': { label: '\ufffd\ufffd\ufffd\ufffd'", "'세공': { label: '세공'")
text = text.replace("'\ufffd\ufffd\u03fc\ufffd\ufffd': { label: '\ufffd\ufffd\u03fc\ufffd\ufffd'", "'완성': { label: '완성'")

# Let's just fix fetchOrders
text = text.replace("if (s === 'PENDING') s = '\ufffd\ufffd\ufffd\ufffd';", "if (s === 'PENDING') s = '접수';")
text = text.replace("else if (s === 'CASTING' || s === '\ufffd\ufffd\u05b0\ufffd\ufffd') s = '\ufffd\ufffd\u05b0\ufffd\ufffd';", "else if (s === 'CASTING' || s === '주물') s = '주물';")
text = text.replace("else if (s === 'POLISHING' || s === '\ufffd\ufffd\ufffd\ufffd') s = '\ufffd\ufffd\ufffd\ufffd';", "else if (s === 'POLISHING' || s === '세공') s = '세공';")
text = text.replace("else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '\ufffd\ufffd\u03fc\ufffd\ufffd';", "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';")
text = text.replace("else s = '\ufffd\ufffd\ufffd\ufffd';", "else s = '접수';")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Stage mapping and array fixed!")
