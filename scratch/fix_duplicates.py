import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove all instances of the constants
data_constants_pattern = r'    const dailyProcessData = \[\s*\{.*?\}\s*\];\s*const dailySubcontractData = \[\s*\{.*?\}\s*\];\n'
text = re.sub(data_constants_pattern, '', text, flags=re.DOTALL)

# 2. Add it exactly ONCE before the final return of the App component.
# The main return is usually `return (` at indentation 4.
data_constants = """    const dailyProcessData = [
        { date: '08/17', CAD: 2.1, 주물: 4.5, 세공: 8.2 },
        { date: '08/18', CAD: 2.4, 주물: 4.2, 세공: 9.1 },
        { date: '08/19', CAD: 1.8, 주물: 5.0, 세공: 12.5 }, 
        { date: '08/20', CAD: 2.5, 주물: 4.1, 세공: 10.8 },
        { date: '08/21', CAD: 2.0, 주물: 4.8, 세공: 8.5 },
        { date: '08/22', CAD: 2.2, 주물: 4.4, 세공: 8.0 },
        { date: '08/23', CAD: 1.9, 주물: 4.0, 세공: 7.5 }
    ];
    
    const dailySubcontractData = [
        { date: '08/17', 제일도금: 24, 성실주물: 12 },
        { date: '08/18', 제일도금: 22, 성실주물: 14 },
        { date: '08/19', 제일도금: 28, 성실주물: 11 },
        { date: '08/20', 제일도금: 25, 성실주물: 16 },
        { date: '08/21', 제일도금: 20, 성실주물: 13 },
        { date: '08/22', 제일도금: 18, 성실주물: 10 },
        { date: '08/23', 제일도금: 21, 성실주물: 12 }
    ];\n"""

text = text.replace("    return (\n        <>\n            <Toast", data_constants + "    return (\n        <>\n            <Toast")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Duplicates removed and inserted at exactly the right place.")
