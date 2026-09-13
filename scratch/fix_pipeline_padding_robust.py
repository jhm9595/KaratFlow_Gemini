import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the py-4 from the Pipeline container to fix the alignment
text = text.replace('className="flex justify-content-between align-items-center px-5 py-4 relative"', 'className="flex justify-content-between align-items-center px-4 relative"')

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Padding replaced successfully!")
