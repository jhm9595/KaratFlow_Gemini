import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace statusBodyTemplate
old_regex = r'    const statusBodyTemplate = \(rowData: any\) => \{.*?\n    \};'
new_template = """    const statusBodyTemplate = (rowData: any) => {
        if (rowData.status === 'CANCELLED') {
            return (
                <div className="flex flex-column gap-1">
                    <span className="p-badge p-badge-secondary">취소됨</span>
                    {rowData.cancellationFee > 0 && <small className="text-red-500 font-bold">위약금 ₩{rowData.cancellationFee.toLocaleString()}</small>}
                </div>
            );
        }
        
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
    };"""

text = re.sub(old_regex, new_template, text, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("statusBodyTemplate replaced with regex!")
