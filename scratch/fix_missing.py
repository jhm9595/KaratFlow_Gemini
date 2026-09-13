import codecs

with codecs.open('frontend/src/App.tsx', 'r', 'utf-8') as f:
    text = f.read()

missing_state = """    const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
    const [filteredProducts, setFilteredProducts] = React.useState<any[]>([]);

    const searchProduct = (event: any) => {
        const query = event.query.toLowerCase();
    };

    const handleFileUpload = (e: any) => {
        if (e.files && e.files[0]) {
            setCreateOrderForm({...createOrderForm, imageUrl: '/uploads/mock.png'});
        }
    };
"""

if 'const [selectedProduct' not in text:
    text = text.replace('const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);', 'const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);\n' + missing_state)

if 'import { AutoComplete }' not in text:
    text = text.replace("import { Dialog } from 'primereact/dialog';", "import { Dialog } from 'primereact/dialog';\nimport { AutoComplete } from 'primereact/autocomplete';")

# Fix rowData error at line 105 which was introduced by my text.replace('setOrderDetailVisible(true);', 'openOrderDetail(rowData.id);', 1) 
text = text.replace('openOrderDetail(rowData.id);', 'setOrderDetailVisible(true);', 1)

with codecs.open('frontend/src/App.tsx', 'w', 'utf-8') as f:
    f.write(text)
