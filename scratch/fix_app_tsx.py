import codecs
import re

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    content = f.read()

# Replace rowClassName
target_dt = "rowClassName={() => 'surface-0 text-900 hover:surface-50 transition-colors transition-duration-200'}"
replacement_dt = "rowClassName={(row: any) => row.isHold ? 'hold-pulse-row' : 'surface-0 text-900 hover:surface-50 transition-colors transition-duration-200'}"
content = content.replace(target_dt, replacement_dt)

# Add Columns
target_col = '<Column header="주문 번호" body={(r) => <span className="font-bold text-primary">#{r.orderNo || r.id}</span>} style={{ minWidth: \'120px\' }} />'

image_col = """<Column header="" style={{width:'52px'}} body={(row: any) => row.imageUrl ? (
                                    <Image src={`http://localhost:8888${row.imageUrl}`} alt="" width="36" height="36" preview style={{objectFit:'cover', borderRadius:'6px'}} />
                                ) : <span className="pi pi-image text-300" />} />"""
qty_col = """<Column header="수량" style={{width:'72px'}} body={(row: any) => <Badge value={`${row.quantity ?? 1}건`} severity="info" />} />"""

if 'style={{width:\'52px\'}}' not in content:
    content = content.replace(target_col, image_col + '\n                                    ' + target_col + '\n                                    ' + qty_col)

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(content)

print("App.tsx fixed")
