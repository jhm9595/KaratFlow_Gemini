import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# 1. Pipeline dynamic fix (Option A implementation)
# We will fetch `process-templates` in App.tsx (or just use the unique stages in the current orders if we don't fetch)
# Let's fetch templates in App.tsx and use the first one (STANDARD_5) as the default pipeline.
state_decl = """    const [processManagerVisible, setProcessManagerVisible] = useState(false);
    const [processTemplates, setProcessTemplates] = useState<any[]>([]);
"""
content = content.replace("const [processManagerVisible, setProcessManagerVisible] = useState(false);", state_decl)

fetch_templates_func = """
    const fetchProcessTemplates = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/process-templates`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setProcessTemplates(data);
            }
        } catch (e) {
            console.error(e);
        }
    };
"""
# insert inside App before useEffect
content = content.replace("const fetchOrders = async () => {", fetch_templates_func + "\n    const fetchOrders = async () => {")

# call fetchProcessTemplates in useEffect
content = content.replace("fetchOrders();\n        fetchRecentGold();", "fetchOrders();\n        fetchRecentGold();\n        fetchProcessTemplates();")

# Pipeline dynamic rendering
pipeline_replacement = """
                                  {/* Dynamic Pipeline (Based on Default Template) */}
                                  {(processTemplates.length > 0 ? processTemplates[0].steps.map((s: any) => s.stageName) : ['접수', 'CAD', '주물', '세공', '완성']).map((stage: string) => ({
                                      name: stage,
                                      count: orders.filter(o => o.stage === stage).length
                                  })).map((s: any) => {
                                      const defaultColors = ['#64748B', '#3B82F6', '#F59E0B', '#EAB308', '#22C55E', '#A855F7'];
                                      const tSteps = processTemplates.length > 0 ? processTemplates[0].steps : [];
                                      const stepIndex = tSteps.findIndex((st: any) => st.stageName === s.name);
                                      const bgHex = stepIndex >= 0 && stepIndex < defaultColors.length ? defaultColors[stepIndex] : '#64748B';
                                      
                                      return (
                                          <div key={s.name} className="flex flex-column align-items-center z-1">
                                              <div className="flex align-items-center justify-content-center text-white border-circle font-bold mb-2 shadow-2"
                                                   style={{ width: '60px', height: '60px', backgroundColor: bgHex }}>
                                                  {s.count}
                                              </div>
                                              <span className="font-medium text-700">{s.name}</span>
                                          </div>
                                      );
                                  })}
"""
content = re.sub(r'\{\[\'\?수\', \'CAD\', \'주물\', \'\?공\', \'\?성\'\].map\(stage => \(\{[\s\S]*?\}\)\)}', pipeline_replacement.strip(), content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("App.tsx pipeline UI updated.")
