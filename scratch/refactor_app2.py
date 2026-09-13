import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Imports to add
imports = """import SystemAlerts from './components/layout/SystemAlerts';
import PrintLabel from './components/print/PrintLabel';
import PrintInvoice from './components/print/PrintInvoice';
"""

if "import SystemAlerts" not in content:
    content = content.replace("import GlobalMetricsWidget", imports + "import GlobalMetricsWidget")

# 1. Remove alerts logic from App.tsx
# Find `const [alerts, setAlerts] = useState<any[]>([]);`
content = re.sub(r'const \[alerts, setAlerts\] = useState<any\[\]>\(\[\]\);\n', '', content)

# Find `const fetchAlerts = async () => { ... };`
content = re.sub(r'const fetchAlerts = async \(\) => \{.*?\};\n', '', content, flags=re.DOTALL)

# Find `fetchAlerts();` inside useEffect
content = re.sub(r'fetchAlerts\(\);\n', '', content)

# Replace the Alerts rendering in the return statement
alerts_ui_regex = r'\{\/\* System Alerts \*\/.*?\}\)\}'
content = re.sub(alerts_ui_regex, '{/* System Alerts */}\n                  <SystemAlerts />', content, flags=re.DOTALL)


# 2. Replace PrintLabel and PrintInvoice
print_label_regex = r'\{\/\* Print Views \*\/.*?<div className="print-mode-label">.*?<\/div>\s*\}'
content = re.sub(print_label_regex, '{/* Print Views */}\n            {printMode === \'label\' && <PrintLabel printOrder={printOrder} />}', content, flags=re.DOTALL)

print_invoice_regex = r'\{printOrder && printMode === \'invoice\' && \(.*?<div className="print-mode-invoice">.*?<\/div>\s*\)\s*\}'
content = re.sub(print_invoice_regex, '{printMode === \'invoice\' && <PrintInvoice printOrder={printOrder} />}', content, flags=re.DOTALL)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("Updated App.tsx with SystemAlerts, PrintLabel, and PrintInvoice!")
