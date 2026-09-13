import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Match the hanging return up to its closing brace
pattern = r"\n\s*return \(\n\s*<span className=\{\`px-3 py-1 border-round-xl font-bold text-sm \$\{mapped\.color\}\`\}>\n\s*\{mapped\.label\}\n\s*</span>\n\s*\);\n\s*\};\n"

content = re.sub(pattern, "\n", content, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed hanging span return")
