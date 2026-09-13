with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("console.error('Error fetching orders:', err)", "console.error('Error fetching orders:', _err)")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
