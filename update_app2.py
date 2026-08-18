import os

app_tsx_path = 'frontend/src/App.tsx'

with open(app_tsx_path, 'r') as f:
    app_tsx = f.read()

# Add useEffect to imports
app_tsx = app_tsx.replace("import { useState, useRef } from 'react';", "import { useState, useRef, useEffect } from 'react';")

# Replace mock orders with state
app_tsx = app_tsx.replace("const mockOrders = [\n    { id: 1, design: 'R-101', stage: 'CAD', isHold: false, date: '2026-08-17' },\n    { id: 2, design: 'N-202', stage: 'PLATING', isHold: true, date: '2026-08-16' },\n    { id: 3, design: 'E-303', stage: 'INSPECTION', isHold: false, date: '2026-08-15' },\n];", 
"// Orders fetched from API")

# Inside App function, add state and useEffect
search_str = "const [changeModalVisible, setChangeModalVisible] = useState(false);"
insert_str = '''const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        fetch('http://localhost:8080/api/orders')
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error('Error fetching orders:', err));
    }, []);'''

app_tsx = app_tsx.replace(search_str, search_str + '\n    ' + insert_str)

# Replace DataTable value
app_tsx = app_tsx.replace('<DataTable value={mockOrders} responsiveLayout="scroll">', '<DataTable value={orders} responsiveLayout="scroll">')

with open(app_tsx_path, 'w') as f:
    f.write(app_tsx)

print("App.tsx updated for API fetch.")
