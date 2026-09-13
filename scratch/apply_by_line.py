import re

with open('scratch/app_head.tsx', 'r', encoding='utf-8') as f:
    base_lines = f.readlines()

with open('scratch/app_diff_clean.patch', 'r', encoding='utf-8') as f:
    patch_lines = f.readlines()

# A patch can be applied by reconstructing the new file directly from the hunks.
# A unified diff hunk contains the output lines verbatim (as ' ' or '+').
# We just need to copy base_lines up to the start of the hunk, then append the hunk's lines,
# and repeat for all hunks.

new_lines = []
base_idx = 0

hunk_header_re = re.compile(r'^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@')

in_hunk = False
hunk_old_start = 0
hunk_old_len = 0

for line in patch_lines:
    match = hunk_header_re.match(line)
    if match:
        old_start = int(match.group(1)) - 1 # 0-indexed
        
        # Catch up from base file
        while base_idx < old_start:
            new_lines.append(base_lines[base_idx])
            base_idx += 1
            
        in_hunk = True
        continue
        
    if in_hunk:
        if line.startswith('---') or line.startswith('+++'):
            continue
        if line.startswith(' '):
            new_lines.append(line[1:])
            base_idx += 1
        elif line.startswith('+'):
            new_lines.append(line[1:])
        elif line.startswith('-'):
            base_idx += 1
        elif line.startswith('@@'):
            # Should be handled by regex
            pass
        elif line == '\n':
            # Empty context line
            new_lines.append('\n')
            base_idx += 1
        elif line == '\\ No newline at end of file\n':
            pass
        else:
            # End of hunk or unexpected
            pass

# Add remaining lines
while base_idx < len(base_lines):
    new_lines.append(base_lines[base_idx])
    base_idx += 1

with open('scratch/app_restored.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Patch applied by line numbers to scratch/app_restored.tsx")
