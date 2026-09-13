import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# 1. Add import for ProcessManager
if "import { ProcessManager }" not in content:
    content = content.replace("import { Toast } from 'primereact/toast';", "import { Toast } from 'primereact/toast';\nimport { ProcessManager } from './ProcessManager';")

# 2. Add state for ProcessManager Modal
state_decl = "const [processManagerVisible, setProcessManagerVisible] = useState(false);"
if state_decl not in content:
    content = content.replace("const [subcontractModalVisible, setSubcontractModalVisible] = useState(false);", "const [subcontractModalVisible, setSubcontractModalVisible] = useState(false);\n    const [processManagerVisible, setProcessManagerVisible] = useState(false);")

# 3. Add a button to open the ProcessManager near the top right (next to "파트너사 연동")
btn_html = """
                                <Button label="공정 관리" icon="pi pi-sitemap" className="p-button-outlined p-button-secondary mr-2" onClick={() => setProcessManagerVisible(true)} />
                                <Button label={t('handshake')} icon="pi pi-users" className="p-button-outlined" onClick={() => setPartnerModalVisible(true)} />
"""
content = re.sub(r'<Button label=\{t\(\'handshake\'\)\} icon="pi pi-users" className="p-button-outlined" onClick=\{\(\) => setPartnerModalVisible\(true\)\} \/>', btn_html.strip(), content)

# 4. Add the component to the JSX
comp_html = """
                {/* @ts-ignore */}
                <ProcessManager visible={processManagerVisible} onHide={() => setProcessManagerVisible(false)} />
"""
if "ProcessManager visible=" not in content:
    # insert before the final closing div of the app layout
    content = content.replace("</div>\n\n            <Dialog header={", comp_html + "\n            </div>\n\n            <Dialog header={")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("App.tsx updated to include ProcessManager.")
