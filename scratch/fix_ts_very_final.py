with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { Tag } from 'primereact/tag';\n", "")
text = text.replace("const [dashboardStats, setDashboardStats]", "const [_dashboardStats, setDashboardStats]")
text = text.replace("{ headers: getAuthHeaders(),  headers: getAuthHeaders() }", "{ headers: getAuthHeaders() }")
text = text.replace("headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }", "headers: getAuthHeaders()")
text = text.replace("catch(err =>", "catch((_err) =>")
text = text.replace("console.error('Error fetching stats:', err)", "console.error('Error fetching stats:', _err)")
text = text.replace("console.error('Error fetching pipeline:', err)", "console.error('Error fetching pipeline:', _err)")
text = text.replace("console.error('Error fetching live events:', err)", "console.error('Error fetching live events:', _err)")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
