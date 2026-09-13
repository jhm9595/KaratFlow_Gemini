import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('className="z-1 flex align-items-center justify-content-center border-circle', 
                          'className="z-1 relative surface-0 flex align-items-center justify-content-center border-circle')

content = content.replace('<Column field="orderNo" header="주문 번호" style={{ minWidth: \'120px\' }} />', 
                          '<Column header="주문 번호" body={(r) => <span className="font-bold text-primary">#{r.orderNo || r.id}</span>} style={{ minWidth: \'120px\' }} />')


new_status_template = """const statusBodyTemplate = (rowData: any) => {
        const stageMap: Record<string, { label: string, color: string }> = {
            '접수': { label: '접수', color: 'bg-indigo-100 text-indigo-700' },
            'CAD': { label: 'CAD', color: 'bg-blue-100 text-blue-700' },
            '주물': { label: '주물', color: 'bg-orange-100 text-orange-700' },
            '세공': { label: '세공', color: 'bg-yellow-100 text-yellow-700' },
            '완성': { label: '완성', color: 'bg-green-100 text-green-700' }
        };
        
        let s = rowData.stage;
        if (!stageMap[s]) {
            if (s === 'PENDING') s = '접수';
            else if (s === 'CAD') s = 'CAD';
            else if (s === 'CASTING') s = '주물';
            else if (s === 'POLISHING') s = '세공';
            else if (s === 'DONE' || rowData.status === 'COMPLETED') s = '완성';
            else s = '접수';
        }
        
        const mapped = stageMap[s] || { label: s, color: 'surface-200 text-700' };
        
        return <span className={`px-3 py-1 border-round-2xl font-bold text-sm ${mapped.color}`}>{mapped.label}</span>;
    };"""

content = re.sub(r'const statusBodyTemplate = \(rowData: any\) => \{.*?\n\s*\};', new_status_template.strip(), content, flags=re.DOTALL)


content = content.replace('<Column header="" body={() => <span className="text-500 text-sm"><i className="pi pi-external-link"></i> 상세 정보</span>} style={{ width: \'100px\' }} />',
                          '<Column header="" body={() => <Button icon="pi pi-search" className="p-button-rounded p-button-text p-button-sm p-button-secondary" aria-label="상세보기" />} style={{ width: \'60px\' }} />')

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("UI fixes applied")
