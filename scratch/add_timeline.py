import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

if "import { Timeline } from 'primereact/timeline';" not in text:
    text = text.replace("import { Dialog } from 'primereact/dialog';", "import { Dialog } from 'primereact/dialog';\nimport { Timeline } from 'primereact/timeline';")

helper_functions = '''
    const formatElapsed = (start: string | null, end: string | null) => {
        if (!start || !end) return '';
        const d1 = new Date(start);
        const d2 = new Date(end);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';
        const diff = Math.max(0, d2.getTime() - d1.getTime());
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        let str = '+';
        if (days > 0) str += `${days}일 `;
        if (hours > 0) str += `${hours}시간 `;
        if (mins > 0 || str === '+') str += `${mins}분`;
        return str;
    };

    const getTimelineEvents = (rowData: any) => {
        const events = [
            { stage: '주문 생성', date: rowData.createdAt, icon: 'pi pi-file', color: '#9E9E9E' },
            { stage: '접수', date: rowData.pendingCompletedAt, icon: 'pi pi-check', color: '#64748B' },
            { stage: 'CAD', date: rowData.cadCompletedAt, icon: 'pi pi-desktop', color: '#3B82F6' },
            { stage: '주물 (Casting)', date: rowData.castingCompletedAt, icon: 'pi pi-box', color: '#F97316' },
            { stage: '세공 (Polishing)', date: rowData.polishingCompletedAt, icon: 'pi pi-star', color: '#EAB308' },
            { stage: '도금/검수', date: rowData.platingCompletedAt, icon: 'pi pi-eye', color: '#22C55E' }
        ];
        
        let validEvents = events.filter(e => e.date);
        
        // Calculate elapsed
        return validEvents.map((ev, i) => {
            let elapsed = '';
            if (i > 0) {
                elapsed = formatElapsed(validEvents[i-1].date, ev.date);
            }
            return { ...ev, elapsed };
        });
    };

    const customizedMarker = (item: any) => {
        return (
            <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: item.color }}>
                <i className={item.icon}></i>
            </span>
        );
    };

    const customizedContent = (item: any) => {
        return (
            <div className="mb-4">
                <div className="font-bold text-700">{item.stage}</div>
                <div className="text-500 text-sm">{new Date(item.date).toLocaleString()}</div>
                {item.elapsed && <div className="text-pink-500 font-bold text-sm mt-1">{item.elapsed}</div>}
            </div>
        );
    };
'''

# insert helper functions before `return (` of App component
if "const formatElapsed" not in text:
    text = text.replace('    return (', helper_functions + '\n    return (')


# insert Timeline in Dialog
old_dialog = r'''                                    <div className="flex justify-content-between mt-3 border-top-1 border-300 pt-3"><span className="text-600">현재 상태</span> <span>\{statusBodyTemplate\(rowData\)\}</span></div>
                                </div>'''

new_dialog = '''                                    <div className="flex justify-content-between mt-3 border-top-1 border-300 pt-3"><span className="text-600">현재 상태</span> <span>{statusBodyTemplate(rowData)}</span></div>
                                </div>
                                
                                <div className="surface-100 p-4 border-round flex flex-column gap-2 mt-3">
                                    <h3 className="m-0 mb-3 text-800">공정 진행 타임라인</h3>
                                    {getTimelineEvents(rowData).length > 0 ? (
                                        <Timeline value={getTimelineEvents(rowData)} align="left" className="customized-timeline" marker={customizedMarker} content={customizedContent} />
                                    ) : (
                                        <div className="text-500">진행된 공정이 없습니다.</div>
                                    )}
                                </div>'''

text = re.sub(old_dialog, new_dialog, text)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Timeline added!")
