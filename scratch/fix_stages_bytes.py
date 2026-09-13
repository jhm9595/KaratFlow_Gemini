with open('frontend/src/App.tsx', 'rb') as f:
    text_bytes = f.read()

# Fix the map array
old_arr = b"{['\xef\xbf\xbd', 'CAD', '\xef\xbf\xbd\xd6\xb0\xef\xbf\xbd', '\xef\xbf\xbd', '\xef\xbf\xbd\xcf\xbc\xef\xbf\xbd'].map(stage => ({"
new_arr = "{['접수', 'CAD', '주물', '세공', '완성'].map(stage => ({".encode('utf-8')
text_bytes = text_bytes.replace(old_arr, new_arr)

# Fix fetchOrders
text_bytes = text_bytes.replace(
    b"if (s === 'PENDING') s = '\xef\xbf\xbd';",
    "if (s === 'PENDING') s = '접수';".encode('utf-8')
)
text_bytes = text_bytes.replace(
    b"else if (s === 'CASTING' || s === '\xef\xbf\xbd\xd6\xb0\xef\xbf\xbd') s = '\xef\xbf\xbd\xd6\xb0\xef\xbf\xbd';",
    "else if (s === 'CASTING' || s === '주물') s = '주물';".encode('utf-8')
)
text_bytes = text_bytes.replace(
    b"else if (s === 'POLISHING' || s === '\xef\xbf\xbd') s = '\xef\xbf\xbd';",
    "else if (s === 'POLISHING' || s === '세공') s = '세공';".encode('utf-8')
)
text_bytes = text_bytes.replace(
    b"else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '\xef\xbf\xbd\xcf\xbc\xef\xbf\xbd';",
    "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '완성';".encode('utf-8')
)
text_bytes = text_bytes.replace(
    b"else s = '\xef\xbf\xbd';",
    "else s = '접수';".encode('utf-8')
)

text_bytes = text_bytes.replace(
    b"else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '\xef\xbf\xbd\xcf\xbc\xef\xbf\xbd';",
    "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';".encode('utf-8')
)

# Fix stageMap
old_stageMap = b"""        const stageMap: Record<string, { label: string, severity: 'success' | 'info' | 'warning' | 'danger' | null }> = {
            '\xef\xbf\xbd': { label: '\xef\xbf\xbd', severity: null },
            'CAD': { label: 'CAD', severity: 'info' },
            '\xef\xbf\xbd\xd6\xb0\xef\xbf\xbd': { label: '\xef\xbf\xbd\xd6\xb0\xef\xbf\xbd', severity: 'warning' },
            '\xef\xbf\xbd': { label: '\xef\xbf\xbd', severity: 'danger' },
            '\xef\xbf\xbd\xcf\xbc\xef\xbf\xbd': { label: '\xef\xbf\xbd\xcf\xbc\xef\xbf\xbd', severity: 'success' }
        };"""
new_stageMap = """        const stageMap: Record<string, { label: string, severity: 'success' | 'info' | 'warning' | 'danger' | null }> = {
            '접수': { label: '접수', severity: null },
            'CAD': { label: 'CAD', severity: 'info' },
            '주물': { label: '주물', severity: 'warning' },
            '세공': { label: '세공', severity: 'danger' },
            '완성': { label: '완성', severity: 'success' }
        };""".encode('utf-8')

text_bytes = text_bytes.replace(old_stageMap, new_stageMap)


with open('frontend/src/App.tsx', 'wb') as f:
    f.write(text_bytes)

print("Direct byte replacement complete!")
