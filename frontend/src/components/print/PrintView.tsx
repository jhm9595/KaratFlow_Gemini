import React from 'react';
import PrintInvoice from './PrintInvoice';
import PrintLabel from './PrintLabel';

interface PrintViewProps {
    printOrder: any;
    printMode: 'label' | 'invoice' | null;
}

const PrintView: React.FC<PrintViewProps> = ({ printOrder, printMode }) => {
    if (!printOrder || !printMode) return null;

    if (printMode === 'label') {
        return <PrintLabel printOrder={printOrder} />;
    }

    if (printMode === 'invoice') {
        return <PrintInvoice printOrder={printOrder} />;
    }

    return null;
};

export default PrintView;
