import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the map array
text = re.sub(r"\{\['[^']*',\s*'CAD',\s*'[^']*',\s*'[^']*',\s*'[^']*'\]\.map\(stage =>", "{['접수', 'CAD', '주물', '세공', '완성'].map(stage =>", text)

# Fix fetchOrders
text = re.sub(r"if \(s === 'PENDING'\) s = '[^']*';", "if (s === 'PENDING') s = '접수';", text)
text = re.sub(r"else if \(s === 'CASTING' \|\| s === '[^']*'\) s = '[^']*';", "else if (s === 'CASTING' || s === '주물') s = '주물';", text)
text = re.sub(r"else if \(s === 'POLISHING' \|\| s === '[^']*'\) s = '[^']*';", "else if (s === 'POLISHING' || s === '세공') s = '세공';", text)
text = re.sub(r"else if \(s === 'PLATING/INSPECTION' \|\| s === 'COMPLETED' \|\| s === 'DONE' \|\| o\.status === 'COMPLETED'\) s = '[^']*';", "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '완성';", text)
text = re.sub(r"else s = '[^']*';", "else s = '접수';", text)

# Fix stageMap
old_stage_map = r"""        const stageMap: Record<string, { label: string, severity: 'success' | 'info' | 'warning' | 'danger' | null }> = \{
            '[^']*': \{ label: '[^']*', severity: null \},
            'CAD': \{ label: 'CAD', severity: 'info' \},
            '[^']*': \{ label: '[^']*', severity: 'warning' \},
            '[^']*': \{ label: '[^']*', severity: 'danger' \},
            '[^']*': \{ label: '[^']*', severity: 'success' \}
        \};"""
new_stage_map = """        const stageMap: Record<string, { label: string, severity: 'success' | 'info' | 'warning' | 'danger' | null }> = {
            '접수': { label: '접수', severity: null },
            'CAD': { label: 'CAD', severity: 'info' },
            '주물': { label: '주물', severity: 'warning' },
            '세공': { label: '세공', severity: 'danger' },
            '완성': { label: '완성', severity: 'success' }
        };"""
text = re.sub(old_stage_map, new_stage_map, text)

# Wait, there's another fetchOrders mapping inside `statusBodyTemplate`!
# Let's fix that one too
text = re.sub(r"else if \(s === 'PLATING/INSPECTION' \|\| s === 'COMPLETED' \|\| s === 'DONE' \|\| rowData\.status === 'COMPLETED'\) s = '[^']*';", "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';", text)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Stage fixing applied!")
