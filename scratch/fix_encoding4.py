import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the specific corrupted strings by looking at the line structure rather than exact byte sequences.

content = re.sub(r"toast\.current\?\.show\(\{ severity: 'success', summary: '[^']+', detail: '[^']+', life: \d+ \}\);", 
                 r"toast.current?.show({ severity: 'success', summary: '성공', detail: '작업이 완료되었습니다.', life: 3000 });", content)
content = re.sub(r"toast\.current\?\.show\(\{ severity: 'error', summary: '[^']+', detail: '[^']+', life: \d+ \}\);", 
                 r"toast.current?.show({ severity: 'error', summary: '오류', detail: '작업 중 오류가 발생했습니다.', life: 3000 });", content)
content = re.sub(r"toast\.current\?\.show\(\{ severity: 'info', summary: '[^']+', detail: [^,]+, life: \d+ \}\);", 
                 r"toast.current?.show({ severity: 'info', summary: '알림', detail: '상태가 업데이트되었습니다.', life: 3000 });", content)
content = re.sub(r"toast\.current\?\.show\(\{ severity: 'warn', summary: '[^']+', detail: '[^']+' \+ data\.statusName \+ '\)', life: \d+ \}\);", 
                 r"toast.current?.show({ severity: 'warn', summary: '주의', detail: '휴폐업 사업자입니다 (' + data.statusName + ')', life: 5000 });", content)

# Fix stage assignments
content = re.sub(r"if \(s === 'PENDING'\) s = '[^']+';", "if (s === 'PENDING') s = '접수';", content)
content = re.sub(r"else if \(s === 'POLISHING' \|\| s === '[^']+'\) s = '[^']+';", "else if (s === 'POLISHING' || s === '세공') s = '세공';", content)
content = re.sub(r"else if \(s === 'PLATING/INSPECTION' \|\| s === 'COMPLETED' \|\| s === 'DONE' \|\| o\.status === 'COMPLETED'\) s = '[^']+';", "else if (s === 'PLATING/INSPECTION' || s === 'COMPLETED' || s === 'DONE' || o.status === 'COMPLETED') s = '완성';", content)
content = re.sub(r"else s = '[^']+';", "else s = '접수';", content)

# Fix data array keys for dailyProcessData
content = re.sub(r"\{ date: '08/17', CAD: 2.1, [^:]+: 4.5, [^:]+: 8.2 \}", "{ date: '08/17', CAD: 2.1, 주물: 4.5, 세공: 8.2 }", content)
content = re.sub(r"\{ date: '08/18', CAD: 2.4, [^:]+: 4.2, [^:]+: 9.1 \}", "{ date: '08/18', CAD: 2.4, 주물: 4.2, 세공: 9.1 }", content)
content = re.sub(r"\{ date: '08/19', CAD: 1.8, [^:]+: 5.0, [^:]+: 12.5 \},.*", "{ date: '08/19', CAD: 1.8, 주물: 5.0, 세공: 12.5 }, // 병목 발생", content)
content = re.sub(r"\{ date: '08/20', CAD: 2.5, [^:]+: 4.1, [^:]+: 10.8 \}", "{ date: '08/20', CAD: 2.5, 주물: 4.1, 세공: 10.8 }", content)
content = re.sub(r"\{ date: '08/21', CAD: 2.0, [^:]+: 4.8, [^:]+: 8.5 \}", "{ date: '08/21', CAD: 2.0, 주물: 4.8, 세공: 8.5 }", content)
content = re.sub(r"\{ date: '08/22', CAD: 2.2, [^:]+: 4.4, [^:]+: 8.0 \}", "{ date: '08/22', CAD: 2.2, 주물: 4.4, 세공: 8.0 }", content)
content = re.sub(r"\{ date: '08/23', CAD: 1.9, [^:]+: 4.0, [^:]+: 7.5 \}", "{ date: '08/23', CAD: 1.9, 주물: 4.0, 세공: 7.5 }", content)

# Fix dailySubcontractData
content = re.sub(r"\{ date: '08/17', [^:]+: 24, [^:]+: 28 \}", "{ date: '08/17', 제일순금: 24, 성실공방: 28 }", content)
content = re.sub(r"\{ date: '08/18', [^:]+: 22, [^:]+: 30 \}", "{ date: '08/18', 제일순금: 22, 성실공방: 30 }", content)
content = re.sub(r"\{ date: '08/19', [^:]+: 25, [^:]+: 35 \}", "{ date: '08/19', 제일순금: 25, 성실공방: 35 }", content)
content = re.sub(r"\{ date: '08/20', [^:]+: 24, [^:]+: 25 \}", "{ date: '08/20', 제일순금: 24, 성실공방: 25 }", content)
content = re.sub(r"\{ date: '08/21', [^:]+: 21, [^:]+: 26 \}", "{ date: '08/21', 제일순금: 21, 성실공방: 26 }", content)
content = re.sub(r"\{ date: '08/22', [^:]+: 20, [^:]+: 28 \}", "{ date: '08/22', 제일순금: 20, 성실공방: 28 }", content)
content = re.sub(r"\{ date: '08/23', [^:]+: 22, [^:]+: 24 \}", "{ date: '08/23', 제일순금: 22, 성실공방: 24 }", content)

# Fix Column tags
content = re.sub(r'<Column header="[^"]+" body=\{\(r\) => <span className="font-bold text-primary">', '<Column header="주문 번호" body={(r) => <span className="font-bold text-primary">', content)
content = re.sub(r'<Column field="customerName" header="[^"]+" />', '<Column field="customerName" header="고객명" />', content)
content = re.sub(r'<Column field="stage" header="[^"]+" body=\{statusBodyTemplate\}></Column>', '<Column field="stage" header="공정 상태" body={statusBodyTemplate}></Column>', content)
content = re.sub(r'aria-label="[^"]+" tooltip="[^"]+" tooltipOptions', 'aria-label="상세보기" tooltip="상세보기" tooltipOptions', content)

# empty message
content = re.sub(r'emptyMessage="[^"]+" className="p-datatable-sm', 'emptyMessage="등록된 주문이 없습니다." className="p-datatable-sm', content)


with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
