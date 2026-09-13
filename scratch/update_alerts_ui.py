import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# 1. Add Message component import
if "import { Message }" not in content:
    content = content.replace("import { Toast } from 'primereact/toast';", "import { Toast } from 'primereact/toast';\nimport { Message } from 'primereact/message';")

# 2. Add alerts state
if "const [alerts, setAlerts] = useState<any[]>([]);" not in content:
    state_injection = """    const [alerts, setAlerts] = useState<any[]>([]);
"""
    content = content.replace("const [globalMetrics, setGlobalMetrics] = useState<any>(null);", "const [globalMetrics, setGlobalMetrics] = useState<any>(null);\n" + state_injection)

# 3. Add fetchAlerts function
if "const fetchAlerts = async () =>" not in content:
    fetch_injection = """    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await fetch('http://localhost:8888/api/system/health/alerts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAlerts(data);
            }
        } catch (e) {
            console.error('Failed to fetch system alerts', e);
        }
    };
"""
    content = content.replace("const fetchGlobalMetrics = async () => {", fetch_injection + "\n    const fetchGlobalMetrics = async () => {")

# 4. Add fetchAlerts to useEffect
if "fetchAlerts();" not in content:
    content = content.replace("fetchGlobalMetrics();", "fetchGlobalMetrics();\n            fetchAlerts();")

# 5. Add UI rendering for alerts
if "alerts.map(" not in content:
    alert_ui = """
                  {/* System Alerts */}
                  {alerts.map((alert, index) => (
                      <div key={index} className="px-4 pt-3 pb-0 no-print">
                          <Message severity={alert.severity} text={`${alert.summary} - ${alert.detail}`} style={{ width: '100%', justifyContent: 'flex-start' }} />
                      </div>
                  ))}
"""
    content = content.replace("{/* APM Header */}", alert_ui + "\n                  {/* APM Header */}")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("Updated App.tsx with Alert logic.")
