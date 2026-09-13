import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

helper_fn = """
    const getEventBorderColor = (msg: string) => {
        if (!msg) return '#3B82F6';
        if (msg.includes('접수') || msg.includes('신규')) return '#64748B';
        if (msg.includes('CAD')) return '#3B82F6';
        if (msg.includes('주물')) return '#F59E0B';
        if (msg.includes('세공')) return '#EF4444';
        if (msg.includes('완성')) return '#22C55E';
        if (msg.includes('보류') || msg.includes('HOLD')) return '#EAB308';
        return '#3B82F6';
    };
"""

text = re.sub(r'(return \(\s*<div className=\"flex flex-column h-screen)', helper_fn + r'\n    \1', text)

old_div = r'className="surface-50 p-3 border-round border-left-3 border-primary shadow-1 fadein animation-duration-300"'
new_div = r'className="surface-50 p-3 border-round border-left-3 shadow-1 fadein animation-duration-300" style={{ borderLeftColor: getEventBorderColor(ev.message) }}'
text = text.replace(old_div, new_div)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated live event feed colors!")
