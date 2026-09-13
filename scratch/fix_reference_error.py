import codecs

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    lines = f.readlines()

new_lines = []
gold_state_line = None

# First pass: find and remove the useState line
for line in lines:
    if "const [goldPriceData, setGoldPriceData] = useState" in line:
        gold_state_line = line
    else:
        new_lines.append(line)

final_lines = []
# Second pass: insert the useState line BEFORE the Gold Price Logic
for line in new_lines:
    if "// --- Gold Price Display Logic ---" in line and gold_state_line:
        final_lines.append(gold_state_line)
    final_lines.append(line)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.writelines(final_lines)

print("Moved goldPriceData useState hook above the usage.")
