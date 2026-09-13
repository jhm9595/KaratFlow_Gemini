import codecs
import re

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    content = f.read()

# Remove getTimelineEvents and formatElapsed and customizedMarker and customizedContent
content = re.sub(r'const getTimelineEvents =.*?\}\;\n', '', content, flags=re.DOTALL)
content = re.sub(r'const formatElapsed =.*?\}\;\n', '', content, flags=re.DOTALL)
content = re.sub(r'const customizedMarker =.*?\}\;\n', '', content, flags=re.DOTALL)
content = re.sub(r'const customizedContent =.*?\}\;\n', '', content, flags=re.DOTALL)

# Add import
content = content.replace("import { Timeline } from 'primereact/timeline';", "import { Timeline } from 'primereact/timeline';\nimport PipelineTimeline from './components/pipeline/PipelineTimeline';")

# Replace <Timeline>
content = re.sub(r'<Timeline value=\{getTimelineEvents\(rowData\)\}.*?\/>', '<PipelineTimeline events={orderDetailData?.timelineEvents || []} />', content, flags=re.DOTALL)

# Check if orderDetailData exists when rendering getTimelineEvents(rowData). Wait, I replaced getTimelineEvents(rowData)
# Wait! In App.tsx, the events were passed `rowData`. But `rowData` is the summary. `orderDetailData` has the detail!
content = content.replace('{getTimelineEvents(rowData).length > 0 ? (', '{orderDetailData?.timelineEvents?.length > 0 ? (')
content = content.replace('{orderDetailData?.timelineEvents?.length > 0 ? (', '{orderDetailData?.timelineEvents && orderDetailData.timelineEvents.length > 0 ? (')

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(content)
print("Frontend Refactored")
