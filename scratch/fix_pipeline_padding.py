import re

with open('frontend/src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the pipeline container classes
old_pipeline_container = """                        {/* Pipeline Visualizer */}
                        <div className="surface-0 p-3 border-round shadow-1">
                            <h4 className="m-0 mb-3 text-600 font-medium">실시간 공정 흐름 (파이프라인)</h4>
                            <div className="flex justify-content-between align-items-center px-5 py-4 relative">"""

new_pipeline_container = """                        <div className="surface-0 p-4 border-round shadow-1">
                            <h4 className="m-0 mb-4 text-600 font-medium">실시간 공정 현황 (Pipeline)</h4>
                            <div className="flex justify-content-between align-items-center px-4 relative">"""

text = text.replace(old_pipeline_container, new_pipeline_container)

with open('frontend/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Pipeline padding fixed!")
