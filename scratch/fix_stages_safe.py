with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "['" in line and "'.map(stage => ({" in line:
        line = "                                {['접수', 'CAD', '주물', '세공', '완성'].map(stage => ({\n"
    elif "if (s === 'PENDING') s =" in line:
        line = "            if (s === 'PENDING') s = '접수';\n"
    elif "else if (s === 'CASTING' || s ===" in line:
        line = "            else if (s === 'CASTING' || s === '주물') s = '주물';\n"
    elif "else if (s === 'POLISHING' || s ===" in line:
        line = "            else if (s === 'POLISHING' || s === '세공') s = '세공';\n"
    elif "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED'" in line:
        line = "            else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED' || o.status === 'COMPLETED') s = '완성';\n"
    elif "else s =" in line and "접수" not in line and "else s = s" not in line:
        line = "            else s = '접수';\n"
    elif "const stageMap: Record" in line:
        line = "        const stageMap: Record<string, { label: string, severity: 'success' | 'info' | 'warning' | 'danger' | null }> = {\n            '접수': { label: '접수', severity: null },\n            'CAD': { label: 'CAD', severity: 'info' },\n            '주물': { label: '주물', severity: 'warning' },\n            '세공': { label: '세공', severity: 'danger' },\n            '완성': { label: '완성', severity: 'success' }\n        };\n"
    # Skip the 5 lines of the old stageMap since we injected the whole thing
    elif "'CAD': { label: 'CAD', severity: 'info' }," in line:
        continue
    elif "severity: null }," in line and "'접수'" not in line:
        continue
    elif "severity: 'warning' }," in line and "'주물'" not in line:
        continue
    elif "severity: 'danger' }," in line and "'세공'" not in line:
        continue
    elif "severity: 'success' }" in line and "'완성'" not in line:
        continue
    new_lines.append(line)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Safely replaced corrupted stage mappings!")
