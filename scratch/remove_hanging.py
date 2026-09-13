with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Instead of regex, let's just find the exact index of the second `let s = rowData.stage;` and delete until the next `};`
first_idx = content.find("let s = rowData.stage;")
if first_idx != -1:
    second_idx = content.find("let s = rowData.stage;", first_idx + 10)
    if second_idx != -1:
        # Find the '};' after second_idx
        end_idx = content.find("};", second_idx)
        if end_idx != -1:
            end_idx += 2 # include '};'
            content = content[:second_idx] + content[end_idx:]

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed hanging remainder")
