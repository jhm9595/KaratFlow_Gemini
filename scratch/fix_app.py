import codecs
import re

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    content = f.read()

# Add import
content = content.replace("import { Timeline } from 'primereact/timeline';", "import { Timeline } from 'primereact/timeline';\nimport PipelineTimeline from './components/pipeline/PipelineTimeline';")

# Find the specific block to replace using string matching instead of wild regex
start_marker = '<h3 className="m-0 mb-3 text-800">공정 타임라인</h3>'
end_marker = '</div>\n                                \n                                <div className="surface-100 p-4 border-round flex flex-column gap-2 mt-2">'
# The block is inside Order Detail Modal
block_regex = re.compile(r'<h3 className="m-0 mb-3 text-800">공정 타임라인</h3>.*?<div className="surface-100 p-4 border-round flex flex-column gap-2 mt-2">', re.DOTALL)

replacement = """<h3 className="m-0 mb-3 text-800">공정 타임라인</h3>
                                    {orderDetailData?.timelineEvents && orderDetailData.timelineEvents.length > 0 ? (
                                        <PipelineTimeline events={orderDetailData.timelineEvents} />
                                    ) : (
                                        <div className="text-500">타임라인 데이터가 없습니다.</div>
                                    )}
                                </div>
                                
                                <div className="surface-100 p-4 border-round flex flex-column gap-2 mt-2">"""

content = block_regex.sub(replacement, content)

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(content)
print("Frontend Fixed safely")
