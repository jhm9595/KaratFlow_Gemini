import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace `{ method: 'POST' }` with `{ method: 'POST', headers: getAuthHeaders() }`
content = re.sub(r"\{\s*method:\s*'POST'\s*\}", "{ method: 'POST', headers: getAuthHeaders() }", content)

# Replace `{ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: ... }`
# with `{ method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: ... }`
content = content.replace("'Content-Type': 'application/json'", "'Content-Type': 'application/json', ...getAuthHeaders()")

# For GET requests that have no options object at all (e.g. `fetch(\`url\`)`)
content = re.sub(r"fetch\((`[^`]+`)\)", r"fetch(\1, { headers: getAuthHeaders() })", content)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied getAuthHeaders() to all API calls")
