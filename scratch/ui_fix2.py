import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('className="z-1 relative surface-0 flex align-items-center justify-content-center border-circle surface-200 border-2 border-primary mb-2 shadow-2"', 
                          'className="z-1 relative bg-white flex align-items-center justify-content-center border-circle surface-200 border-2 border-primary mb-2 shadow-2"')

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
