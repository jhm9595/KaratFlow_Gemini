import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace col-3 with col-12 md:col-6 lg:col-3 flex flex-column gap-2
# and replace w-full mt-1 with w-full
# inside the Subcontract Modal grid

# We can just target the 4 specific labels to be very precise.
patterns = [
    (r'<div className="col-3">\s*<label>작업명\(ex 도금\)</label>\s*<InputText className="w-full mt-1"',
     r'<div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">\n                                    <label>작업명(ex 도금)</label>\n                                    <InputText className="w-full"'),
    
    (r'<div className="col-3">\s*<label>외주업체명</label>\s*<InputText className="w-full mt-1"',
     r'<div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">\n                                    <label>외주업체명</label>\n                                    <InputText className="w-full"'),
    
    (r'<div className="col-3">\s*<label>반출 실측 중량 \(g\)</label>\s*<InputNumber className="w-full mt-1"',
     r'<div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">\n                                    <label>반출 실측 중량 (g)</label>\n                                    <InputNumber className="w-full"'),
    
    (r'<div className="col-3">\s*<label>합의 외주공임 \(원\)</label>\s*<InputNumber className="w-full mt-1"',
     r'<div className="col-12 md:col-6 lg:col-3 flex flex-column gap-2">\n                                    <label>합의 외주공임 (원)</label>\n                                    <InputNumber className="w-full"')
]

for old_p, new_p in patterns:
    text = re.sub(old_p, new_p, text)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Regex replace applied!")
