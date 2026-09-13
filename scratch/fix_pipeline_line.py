import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix middle line covering numbers
# Replace the absolute line with z-index 0 with a line that has z-index -1
line_search = '<div className="absolute border-top-2 border-300 z-0" style={{ top: \'50%\', left: \'4rem\', right: \'4rem\', transform: \'translateY(-50%)\' }}></div>'
line_replace = '<div className="absolute border-top-2 border-300" style={{ top: \'30px\', left: \'4rem\', right: \'4rem\', zIndex: 0 }}></div>'
if line_search in text:
    text = text.replace(line_search, line_replace)
    
circle_wrap_search = 'className="flex flex-column align-items-center z-1 relative bg-white" style={{ borderRadius: \'50%\' }}'
circle_wrap_replace = 'className="flex flex-column align-items-center relative" style={{ zIndex: 1 }}'
if circle_wrap_search in text:
    text = text.replace(circle_wrap_search, circle_wrap_replace)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Line overlay fixed!")
