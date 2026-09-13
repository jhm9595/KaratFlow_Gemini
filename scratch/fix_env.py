import codecs
import re

with codecs.open('backend/.env', 'r', 'utf-8', errors='ignore') as f:
    lines = f.readlines()

clean_lines = []
for line in lines:
    clean_line = line.replace('\x00', '').replace('G O L D _ A P I _ K E Y =', '').strip()
    if clean_line:
        clean_lines.append(clean_line)

clean_lines.append("GOLD_API_KEY=")

with codecs.open('backend/.env', 'w', 'utf-8') as f:
    f.write('\n'.join(clean_lines) + '\n')

print("Fixed .env file encoding.")
