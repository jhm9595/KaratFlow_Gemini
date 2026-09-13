import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

modals_to_inject = """
                {/* @ts-ignore */}
                <ProcessManager visible={processManagerVisible} onHide={() => setProcessManagerVisible(false)} />
                {/* @ts-ignore */}
                <GoldToolsModal visible={goldToolsVisible} onHide={() => setGoldToolsVisible(false)} recentPrices={goldPriceData} />
            )}
        </>
    );
}

export default App;
"""

# Replace the end of the file with the modals injected
content = re.sub(r'            \)\}\s*</>\s*\);\s*\}\s*export default App;\s*$', modals_to_inject, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Injected modals at the end of App.tsx")
