import codecs
import re

file_path = 'frontend/src/App.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

pattern = r'const renderDelta = \(delta: number\) => \{\s*if \(delta > 0\) return <span className="text-red-500 text-sm font-bold ml-2">▲ \{delta\.toLocaleString\(\)\}<\/span>;\s*if \(delta < 0\) return <span className="text-blue-500 text-sm font-bold ml-2">▼ \{Math\.abs\(delta\)\.toLocaleString\(\)\}<\/span>;\s*return <span className="text-600 text-sm font-bold ml-2">-<\/span>;\s*\};'

replacement = """const renderDelta = (delta: number) => {
        if (delta > 0) return <span className="text-red-500 text-sm font-bold">▲ {delta.toLocaleString()}</span>;
        if (delta < 0) return <span className="text-blue-500 text-sm font-bold">▼ {Math.abs(delta).toLocaleString()}</span>;
        return <span className="text-600 text-sm font-bold">-</span>;
    };"""

content = re.sub(pattern, replacement, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Removed ml-2 from renderDelta")
