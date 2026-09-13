import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace stageColors using regex to ignore exact whitespace
text = re.sub(
    r"const stageColors: Record<string, \{bg: string, border: string, text: string\}> = \{.*?\};",
    """const stageColors: Record<string, {bg: string, border: string, text: string, bgHex: string, borderHex: string}> = {
                                          '접수': { bg: '', border: '', text: 'text-white', bgHex: '#3B82F6', borderHex: '#2563EB' },
                                          'CAD': { bg: '', border: '', text: 'text-white', bgHex: '#3B82F6', borderHex: '#2563EB' },
                                          '주물': { bg: '', border: '', text: 'text-white', bgHex: '#F59E0B', borderHex: '#D97706' },
                                          '세공': { bg: '', border: '', text: 'text-white', bgHex: '#EF4444', borderHex: '#DC2626' },
                                          '완성': { bg: '', border: '', text: 'text-white', bgHex: '#22C55E', borderHex: '#16A34A' }
                                      };""",
    text,
    flags=re.DOTALL
)

# Replace the JSX rendering
text = re.sub(
    r"<div className=\{`flex align-items-center justify-content-center border-circle border-2 \$\{color\.bg\} \$\{color\.border\} mb-2 shadow-1`\} style=\{\{ width: '60px', height: '60px' \}\}>",
    r"<div className={`flex align-items-center justify-content-center border-circle border-2 mb-2 shadow-1`} style={{ width: '60px', height: '60px', backgroundColor: color.bgHex, borderColor: color.borderHex }}>",
    text
)

# Also update the fallback
text = text.replace(
    "const color = stageColors[s.name] || { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-500' };",
    "const color = stageColors[s.name] || { bg: '', border: '', text: 'text-gray-500', bgHex: '#F3F4F6', borderHex: '#E5E7EB' };"
)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied robust regex replacement!")
