import os

yaml_path = 'backend/src/main/resources/application.yml'
with open(yaml_path, 'r') as f:
    yaml = f.read()

yaml = yaml.replace("ddl-auto: validate", "ddl-auto: create")
yaml = yaml.replace("enabled: true", "enabled: false")

with open(yaml_path, 'w') as f:
    f.write(yaml)

print("Changed to ddl-auto: create and disabled flyway.")
