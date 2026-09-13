import codecs
import re

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    content = f.read()

# Add imports if missing
if "import { Image } from 'primereact/image';" not in content:
    content = content.replace("import { DataTable }", "import { Image } from 'primereact/image';\nimport { Badge } from 'primereact/badge';\nimport { DataTable }")

# Add rowClassName to DataTable (for the main dashboard)
# Find the main DataTable. Let's look for `<DataTable value={orders}`
if "rowClassName=" not in content.split("<DataTable value={orders}")[1].split(">")[0]:
    content = content.replace("<DataTable value={orders} paginator", "<DataTable value={orders} paginator rowClassName={(row: any) => ({'hold-pulse-row': Boolean(row.isHold)})}")

# Add Image Column and Quantity Column
# Find `<Column field="orderNo" header="주문번호"`
image_col = """<Column header="" style={{width:'52px'}} body={(row: any) => row.imageUrl ? (
                                    <Image src={`http://localhost:8888${row.imageUrl}`} alt="" width="36" height="36" preview style={{objectFit:'cover', borderRadius:'6px'}} />
                                ) : <span className="pi pi-image text-300" />} />
                                """
qty_col = """<Column header="수량" style={{width:'72px'}} body={(row: any) => <Badge value={`${row.quantity ?? 1}건`} severity="info" />} />
                                """

if 'style={{width:\'52px\'}}' not in content:
    content = content.replace('<Column field="orderNo" header="주문번호"', image_col + '<Column field="orderNo" header="주문번호"')

if 'severity="info"' not in content:
    # insert qty after orderNo
    content = content.replace('header="주문번호" style={{ minWidth: \'12rem\' }} />', 'header="주문번호" style={{ minWidth: \'12rem\' }} />\n' + qty_col)

# Add workOrderNo column to the Detail Dialog DataTable
# Find `<DataTable value={orderDetailData.workOrders}`
if 'field="workOrderNo"' not in content:
    target_dt = '<DataTable value={orderDetailData.workOrders} dataKey="id" size="small">'
    if target_dt in content:
        content = content.replace(target_dt, target_dt + '\n                                        <Column field="workOrderNo" header="바코드" />')
    else:
        # try a softer match
        content = re.sub(r'(<DataTable value=\{orderDetailData\.workOrders\}[^>]*>)', r'\1\n                                        <Column field="workOrderNo" header="바코드" />', content)


with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(content)

css_addition = """
.hold-pulse-row > td {
    animation: holdPulse 1.5s ease-in-out infinite;
    background-color: rgba(239, 68, 68, 0.08) !important;
}
@keyframes holdPulse {
    0%, 100% { background-color: rgba(239, 68, 68, 0.08); }
    50% { background-color: rgba(239, 68, 68, 0.18); }
}
"""
with codecs.open('frontend/src/index.css', 'a', 'utf-8') as f:
    f.write(css_addition)

print("Frontend files modified successfully")
