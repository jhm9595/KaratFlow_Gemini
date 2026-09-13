import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the stageColors definition in App.tsx
old_stageColors = """                                      const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                          '접수': { bg: 'bg-primary', border: 'border-primary', text: 'text-white' },
                                          'CAD': { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-white' },
                                          '주물': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white' },
                                          '세공': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-white' },
                                          '완성': { bg: 'bg-green-500', border: 'border-green-500', text: 'text-white' }
                                      };"""

new_stageColors = """                                      const stageColors: Record<string, {bg: string, border: string, text: string, bgHex: string, borderHex: string}> = {
                                          '접수': { bg: '', border: '', text: 'text-white', bgHex: '#3B82F6', borderHex: '#2563EB' },
                                          'CAD': { bg: '', border: '', text: 'text-white', bgHex: '#3B82F6', borderHex: '#2563EB' },
                                          '주물': { bg: '', border: '', text: 'text-white', bgHex: '#F59E0B', borderHex: '#D97706' },
                                          '세공': { bg: '', border: '', text: 'text-white', bgHex: '#EF4444', borderHex: '#DC2626' },
                                          '완성': { bg: '', border: '', text: 'text-white', bgHex: '#22C55E', borderHex: '#16A34A' }
                                      };"""

text = text.replace(old_stageColors, new_stageColors)

# Replace the JSX rendering
old_jsx = r"""                                              <div className={`flex align-items-center justify-content-center border-circle border-2 \$\{color\.bg\} \$\{color\.border\} mb-2 shadow-1`} style={{ width: '60px', height: '60px' }}>
                                                  <span className={`text-2xl font-bold \$\{color\.text\}`}>{s.count}</span>
                                              </div>"""

new_jsx = """                                              <div className={`flex align-items-center justify-content-center border-circle border-2 mb-2 shadow-1`} style={{ width: '60px', height: '60px', backgroundColor: color.bgHex, borderColor: color.borderHex }}>
                                                  <span className={`text-2xl font-bold ${color.text}`}>{s.count}</span>
                                              </div>"""

text = re.sub(old_jsx, new_jsx, text)

# Also update the fallback
text = text.replace(
    "const color = stageColors[s.name] || { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-500' };",
    "const color = stageColors[s.name] || { bg: '', border: '', text: 'text-gray-500', bgHex: '#F3F4F6', borderHex: '#E5E7EB' };"
)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Replaced with inline hex colors to guarantee visibility!")
