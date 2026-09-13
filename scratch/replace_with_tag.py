import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import if missing
if "import { Tag } from 'primereact/tag';" not in content:
    content = content.replace("import { Badge } from 'primereact/badge';", "import { Badge } from 'primereact/badge';\nimport { Tag } from 'primereact/tag';")

# Replace statusBodyTemplate mapping
# Note: PrimeReact Tag severity options: 'success', 'info', 'warning', 'danger', null
# Let's map '접수' -> null (default), 'CAD' -> 'info', '주물' -> 'warning', '세공' -> 'danger', '완성' -> 'success'
replacement = """
    const statusBodyTemplate = (rowData: any) => {
        const stageMap: Record<string, { label: string, severity: 'success' | 'info' | 'warning' | 'danger' | null }> = {
            '접수': { label: '접수', severity: null },
            'CAD': { label: 'CAD', severity: 'info' },
            '주물': { label: '주물', severity: 'warning' },
            '세공': { label: '세공', severity: 'danger' },
            '완성': { label: '완성', severity: 'success' }
        };
        
        let s = rowData.stage;
        if (s) s = s.toUpperCase();
        
        if (!stageMap[s]) {
            if (s === 'PENDING') s = '접수';
            else if (s === 'CAD') s = 'CAD';
            else if (s === 'CASTING' || s === '주물') s = '주물';
            else if (s === 'POLISHING' || s === '세공') s = '세공';
            else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';
            else s = '접수';
        }
        
        const mapped = stageMap[s] || { label: s, severity: null };
        
        return (
            <Tag severity={mapped.severity} value={mapped.label} rounded></Tag>
        );
    };
"""

# Regex substitution to replace the old statusBodyTemplate entirely
pattern = r"\s*const statusBodyTemplate = \(rowData: any\) => \{.*?\};\n"
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced custom span with PrimeReact Tag")
