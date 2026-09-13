import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update statusBodyTemplate
old_status_body_template = """    const statusBodyTemplate = (rowData: any) => {
        if (rowData.status === 'CANCELLED') {
            return (
                <div className="flex flex-column gap-1">
                    <span className="p-badge p-badge-secondary">취소됨</span>
                    {rowData.cancellationFee > 0 && <small className="text-red-500 font-bold">위약금 ₩{rowData.cancellationFee.toLocaleString()}</small>}
                </div>
            );
        }
        const badgeClass = rowData.isHold ? 'p-badge-danger' : 'p-badge-success';
        return <span className={"p-badge " + badgeClass}>{rowData.isHold ? t('hold') : rowData.stage}</span>;
    };"""

new_status_body_template = """    const statusBodyTemplate = (rowData: any) => {
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

text = text.replace(old_status_body_template, new_status_body_template)

# 2. Update the Pipeline Line and stageCounts logic
old_pipeline = """                                {/* Connecting Line */}
                                <div className="absolute border-top-2 border-300" style={{ top: '35px', left: '4rem', right: '4rem', zIndex: 0 }}></div>
                                
                                {[{name: '접수', count: orders.filter(o => o.stage==='PENDING').length}, {name: 'CAD', count: orders.filter(o => o.stage==='CAD').length}, {name: '주물', count: orders.filter(o => o.stage==='CASTING').length}, {name: '세공', count: orders.filter(o => o.stage==='POLISHING').length}, {name: '완성', count: orders.filter(o => o.stage==='COMPLETED').length}].map((s) => {
                                    const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                        '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                        'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                        '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                        '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                        '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                    };
                                    const color = stageColors[s.name] || stageColors['접수'];
                                    
                                    return (
                                        <div key={s.name} className="flex flex-column align-items-center relative" style={{ zIndex: 1 }}>
                                            <div className={`flex align-items-center justify-content-center border-circle border-2 ${color.bg} ${color.border} mb-2 shadow-1 bg-white`} style={{ width: '70px', height: '70px' }}>
                                                <span className={`text-2xl font-bold ${color.text}`}>{s.count}</span>
                                            </div>
                                            <span className="text-700 font-medium bg-white px-2">{s.name}</span>
                                        </div>
                                    );
                                })}"""

new_pipeline = """                                {/* Connecting Line */}
                                <div className="absolute w-full z-0" style={{ height: '4px', backgroundColor: '#e5e7eb', top: '30px', left: '0' }}></div>
                                
                                {['접수', 'CAD', '주물', '세공', '완성'].map(stage => ({
                                    name: stage,
                                    count: orders.filter(o => o.stage === stage).length
                                })).map((s) => {
                                    const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                        '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                        'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                        '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                        '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                        '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                    };
                                    const color = stageColors[s.name] || stageColors['접수'];
                                    
                                    return (
                                        <div key={s.name} className="flex flex-column align-items-center z-1 relative bg-white" style={{ borderRadius: '50%' }}>
                                            <div className={`flex align-items-center justify-content-center border-circle border-2 ${color.bg} ${color.border} mb-2 shadow-1 bg-white`} style={{ width: '60px', height: '60px' }}>
                                                <span className={`text-2xl font-bold ${color.text}`}>{s.count}</span>
                                            </div>
                                            <span className="text-700 font-medium bg-white px-2">{s.name}</span>
                                        </div>
                                    );
                                })}"""

text = text.replace(old_pipeline, new_pipeline)

# 3. Import Tag
if "import { Tag } from 'primereact/tag';" not in text:
    text = "import { Tag } from 'primereact/tag';\n" + text

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Status tags and pipeline styling fixed!")
