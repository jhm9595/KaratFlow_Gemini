import codecs

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace("import PipelineTimeline from './components/pipeline/PipelineTimeline';", "")
content = content.replace("const [processTemplates, setProcessTemplates] = useState<any[]>([]);", "")
content = content.replace("import { LineChart, Line } from 'recharts';", "")

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(content)
