import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the Pipeline
old_regex = r'\{\/\* Connecting Line \*\/\}.*?\}\)\}'
new_pipeline = """{/* Connecting Line */}
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

text = re.sub(old_regex, new_pipeline, text, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Pipeline replaced with regex!")
