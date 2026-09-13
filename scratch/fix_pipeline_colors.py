import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_colors = """                                    const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                        '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                        'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                        '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                        '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                        '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                    };"""

# We'll use the exact PrimeFlex classes that mimic PrimeReact's Tag severities
new_colors = """                                    const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                        '접수': { bg: 'bg-primary', border: 'border-primary', text: 'text-white' },
                                        'CAD': { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-white' },
                                        '주물': { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-white' },
                                        '세공': { bg: 'bg-red-500', border: 'border-red-500', text: 'text-white' },
                                        '완성': { bg: 'bg-green-500', border: 'border-green-500', text: 'text-white' }
                                    };"""

text = text.replace(old_colors, new_colors)

# Wait, in the pipeline we have:
# <div className={`flex align-items-center justify-content-center border-circle border-2 ${color.bg} ${color.border} mb-2 shadow-1 bg-white`}
# We need to remove `bg-white` from there so our solid bg applies!
old_circle = r'<div className={`flex align-items-center justify-content-center border-circle border-2 \$\{color\.bg\} \$\{color\.border\} mb-2 shadow-1 bg-white`}'
new_circle = r'<div className={`flex align-items-center justify-content-center border-circle border-2 ${color.bg} ${color.border} mb-2 shadow-1`}'

text = re.sub(old_circle, new_circle, text)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Pipeline colors updated to match Tags!")
