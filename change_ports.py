import os
import re

# 1. Update application.yml to use port 8888
yaml_path = 'backend/src/main/resources/application.yml'
if os.path.exists(yaml_path):
    with open(yaml_path, 'r') as f:
        yaml = f.read()
    yaml = yaml.replace("port: 8080", "port: 8888")
    with open(yaml_path, 'w') as f:
        f.write(yaml)

# 2. Update WebConfig.java to allow port 5555
web_config = 'backend/src/main/java/com/minibig/karatflow/backend/config/WebConfig.java'
if os.path.exists(web_config):
    with open(web_config, 'r') as f:
        wc = f.read()
    wc = wc.replace("5173", "5555")
    with open(web_config, 'w') as f:
        f.write(wc)

# 3. Update vite.config.ts to run on 5555
vite_config = 'frontend/vite.config.ts'
if os.path.exists(vite_config):
    with open(vite_config, 'r') as f:
        vite = f.read()
    
    if "server: {" not in vite:
        vite = vite.replace("plugins: [react()],", "plugins: [react()],\n  server: { port: 5555 },")
        with open(vite_config, 'w') as f:
            f.write(vite)

# 4. Update App.tsx to fetch from 8888
app_tsx = 'frontend/src/App.tsx'
if os.path.exists(app_tsx):
    with open(app_tsx, 'r') as f:
        app = f.read()
    app = app.replace("http://localhost:8080", "http://localhost:8888")
    with open(app_tsx, 'w') as f:
        f.write(app)

print("Ports changed successfully (Backend: 8888, Frontend: 5555)")
