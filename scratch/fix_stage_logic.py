import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """        let s = rowData.stage;
        if (!stageMap[s]) {
            if (s === 'PENDING') s = '접수';
            else if (s === 'CAD') s = 'CAD';
            else if (s === 'CASTING') s = '주물';
            else if (s === 'POLISHING') s = '세공';
            else if (s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';
            else s = '접수';
        }"""

new_logic = """        let s = rowData.stage;
        if (s) s = s.toUpperCase();
        
        if (!stageMap[s]) {
            if (s === 'PENDING') s = '접수';
            else if (s === 'CAD') s = 'CAD';
            else if (s === 'CASTING' || s === '주물') s = '주물';
            else if (s === 'POLISHING' || s === '세공') s = '세공';
            else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';
            else s = '접수';
        }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed stage mapping logic")
else:
    print("Could not find old logic block")
