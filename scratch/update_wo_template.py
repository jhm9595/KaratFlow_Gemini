import codecs
import re

file_path = 'backend/src/main/java/com/minibig/karatflow/backend/domain/WorkOrder.java'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

import_statement = "import java.time.format.DateTimeFormatter;"
if "ProcessTemplate" not in content:
    content = content.replace(import_statement, import_statement + "\nimport com.minibig.karatflow.backend.domain.ProcessTemplate;")

template_field = """
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "process_template_id")
    private ProcessTemplate processTemplate;
"""
if "processTemplate" not in content:
    content = content.replace("private Long orderItemId;", "private Long orderItemId;\n" + template_field)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("WorkOrder.java updated with processTemplate.")
