import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Put back dashboardStats
if "const [dashboardStats, setDashboardStats]" not in text:
    text = text.replace("const [orders, setOrders] = useState<any[]>([]);", """const [orders, setOrders] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState({
        totalRevenue: 0,
        activeOrders: 0,
        totalOrders: 0,
        cancellationRate: 0
    });""")

# Fix `catch(err =>`
text = re.sub(r'catch\(\s*err\s*=>', 'catch((_err: any) =>', text)

# Fix Badge import
text = text.replace("import { Badge } from 'primereact/badge';", "")

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)


# Fix ProductStats.tsx
with open('frontend/src/pages/ProductStats.tsx', 'r', encoding='utf-8') as f:
    stats = f.read()
    
stats = re.sub(r'import\s+React.*?from\s+[\'"]react[\'"];', "import { useState, useEffect } from 'react';", stats)

with open('frontend/src/pages/ProductStats.tsx', 'w', encoding='utf-8') as f:
    f.write(stats)

print("Fixed.")
