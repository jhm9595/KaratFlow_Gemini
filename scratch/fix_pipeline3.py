import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_pipeline = """{/* Pipeline Status */}
                    <div className="surface-0 p-4 border-round shadow-1">
                        <h4 className="m-0 mb-4 text-600 font-medium">실시간 공정 현황 (Pipeline)</h4>
                        <div className="flex justify-content-between align-items-center px-4 relative">
                            {/* Background Line that goes behind all circles */}
                            <div className="absolute w-full z-0" style={{ height: '4px', backgroundColor: '#e5e7eb', top: '30px', left: '0' }}></div>
                            
                            {stageCounts.map((s, i) => {
                                const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                    '접수': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
                                    'CAD': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
                                    '주물': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
                                    '세공': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
                                    '완성': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' }
                                };
                                const color = stageColors[s.name] || stageColors['접수'];
                                
                                return (
                                    <div key={s.name} className="flex flex-column align-items-center z-1 relative bg-white" style={{ borderRadius: '50%' }}>
                                        <div className={`flex align-items-center justify-content-center border-circle border-2 ${color.bg} ${color.border} mb-2 shadow-1`} style={{ width: '60px', height: '60px' }}>
                                            <span className={`text-2xl font-bold ${color.text}`}>{s.count}</span>
                                        </div>
                                        <span className="text-700 font-medium bg-white px-2">{s.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>"""

# Safely extract and replace the pipeline block
start_idx = content.find('{/* Pipeline Status */}')
end_idx = content.find('{/* Data Table */}')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_pipeline + "\n\n                    " + content[end_idx:]
    with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed pipeline colors and line")
else:
    print("Could not find pipeline block boundaries")
