import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

search = """                                const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                    '접수': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
                                    'CAD': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
                                    '주물': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
                                    '세공': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
                                    '완성': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' }
                                };"""

replace = """                                const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                    '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                    'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                    '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                    '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                    '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                };"""

# We'll use regex since Korean characters might be messed up
pattern = r"const stageColors: Record<string, {bg: string, border: string, text: string}> = \{.*?\};"

# Let's manually reconstruct the Korean strings in the replacement to match the original object keys
replace_regex = """const stageColors: Record<string, {bg: string, border: string, text: string}> = {
                                    '접수': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
                                    'CAD': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                                    '주물': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
                                    '세공': { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
                                    '완성': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' }
                                };"""

content = re.sub(pattern, replace_regex, content, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated pipeline colors to match PrimeReact Tag severity")
