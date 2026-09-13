import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Try to find the exact column definition
match = re.search(r'<Column field="status" header="상태" body=\{\(r\) => <span className=\{`p-badge \$\{r\.status === \'RECEIVED\' \? \'p-badge-info\' : \'p-badge-warning\'\}`\}>\{r\.status\}</span>\}></Column>', text)

if match:
    new_col = """<Column field="status" header="상태" body={(r) => {
                                      const isReceived = r.status === 'RECEIVED';
                                      return <Tag severity={isReceived ? 'success' : 'warning'} value={isReceived ? '반입완료' : '반출됨'} rounded></Tag>;
                                  }}></Column>"""
    text = text.replace(match.group(0), new_col)
    
    with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Successfully replaced subcontract status column!")
else:
    print("Could not find the target column definition. Printing nearby lines:")
    for i, line in enumerate(text.splitlines()):
        if 'p-badge' in line:
            print(f"{i}: {line.strip()}")
