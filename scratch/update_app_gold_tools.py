import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# 1. Add import
if "import { GoldToolsModal }" not in content:
    content = content.replace("import { ProcessManager } from './ProcessManager';", "import { ProcessManager } from './ProcessManager';\nimport { GoldToolsModal } from './GoldToolsModal';")

# 2. Add state
if "goldToolsVisible" not in content:
    state_decl = "const [processManagerVisible, setProcessManagerVisible] = useState(false);\n    const [goldToolsVisible, setGoldToolsVisible] = useState(false);"
    content = content.replace("const [processManagerVisible, setProcessManagerVisible] = useState(false);", state_decl)

# 3. Add button below the chart.
# The chart is inside `<div className="flex-1 mt-3" style={{ minHeight: '200px' }}> ... </ResponsiveContainer> </div>`
chart_container_pattern = r'(<ResponsiveContainer width="100%" height="100%">[\s\S]*?</ResponsiveContainer>\s*</div>)'
chart_replacement = r'\1\n                                <div className="flex justify-content-end mt-2">\n                                    <Button label="✨ 금 시세 심층 도구 및 계산기" className="p-button-outlined p-button-sm p-button-warning" icon="pi pi-calculator" onClick={() => setGoldToolsVisible(true)} />\n                                </div>'
content = re.sub(chart_container_pattern, chart_replacement, content)

# 4. Add the component before the final closing tag
if "<GoldToolsModal visible={goldToolsVisible}" not in content:
    modal_tag = """
                {/* @ts-ignore */}
                <GoldToolsModal visible={goldToolsVisible} onHide={() => setGoldToolsVisible(false)} recentPrices={recentGoldPrices} />
"""
    content = content.replace("<ProcessManager visible={processManagerVisible}", modal_tag + "\n                <ProcessManager visible={processManagerVisible}")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("App.tsx updated with GoldToolsModal.")
