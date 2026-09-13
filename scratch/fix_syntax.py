import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# I will find the flawed block at the end
bad_pattern = r"""                \{/\* @ts-ignore \*/\}
                <ProcessManager visible=\{processManagerVisible\} onHide=\{\(\) => setProcessManagerVisible\(false\)\} />
                \{/\* @ts-ignore \*/\}
                <GoldToolsModal visible=\{goldToolsVisible\} onHide=\{\(\) => setGoldToolsVisible\(false\)\} recentPrices=\{goldPriceData\} />
            \)\}
        </>"""

fixed = """            )}

            {/* @ts-ignore */}
            <ProcessManager visible={processManagerVisible} onHide={() => setProcessManagerVisible(false)} />
            {/* @ts-ignore */}
            <GoldToolsModal visible={goldToolsVisible} onHide={() => setGoldToolsVisible(false)} recentPrices={goldPriceData} />
        </>"""

content = re.sub(bad_pattern, fixed, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Fixed syntax error.")
