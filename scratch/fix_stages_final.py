import re

with open('frontend/src/App.tsx', 'rb') as f:
    text_bytes = f.read()

# Let's decode it, ignoring errors, but replacing exactly what we want.
# Actually, if the file contains \xef\xbf\xbd literally, we can just decode to utf-8.
text = text_bytes.decode('utf-8')

# The pipeline map array
old_array = "{['\ufffd\ufffd\ufffd\ufffd', 'CAD', '\ufffd\ufffd\u05b0\ufffd\ufffd', '\ufffd\ufffd\ufffd\ufffd', '\ufffd\ufffd\u03fc\ufffd\ufffd'].map(stage => ({"
new_array = "{['접수', 'CAD', '주물', '세공', '완성'].map(stage => ({"
text = text.replace(old_array, new_array)

# We also know from previous `python -c` output exactly what it was:
# '', 'CAD', 'ֹ', '', 'ϼ'
# Let's just use regex to replace the array safely
text = re.sub(r"\{\['\ufffd', 'CAD', '\ufffd\u05b0\ufffd', '\ufffd', '\ufffd\u03fc\ufffd'\].map\(stage =>", "{['접수', 'CAD', '주물', '세공', '완성'].map(stage =>", text)

# Just fix all 'PENDING' mappings
text = re.sub(r"if \(s === 'PENDING'\) s = '[^']*';", "if (s === 'PENDING') s = '접수';", text)
text = re.sub(r"else if \(s === 'CASTING' \|\| s === '[^']*'\) s = '[^']*';", "else if (s === 'CASTING' || s === '주물') s = '주물';", text)
text = re.sub(r"else if \(s === 'POLISHING' \|\| s === '[^']*'\) s = '[^']*';", "else if (s === 'POLISHING' || s === '세공') s = '세공';", text)
text = re.sub(r"else if \(s === 'PLATING/INSPECTION' \|\| s === 'COMPLETED' \|\| s === 'DONE' \|\| o\.status === 'COMPLETED'\) s = '[^']*';", "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '완성';", text)
text = re.sub(r"else s = '[^']*';", "else s = '접수';", text)
text = re.sub(r"else if \(s === 'PLATING/INSPECTION' \|\| s === 'COMPLETED' \|\| s === 'DONE' \|\| rowData\.status === 'COMPLETED'\) s = '[^']*';", "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';", text)

# Fix stageMap in statusBodyTemplate
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


with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Replacement complete!")
