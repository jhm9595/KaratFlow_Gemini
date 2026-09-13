import React from 'react';

interface PrintLabelProps {
    printOrder: any;
}

const PrintLabel: React.FC<PrintLabelProps> = ({ printOrder }) => {
    if (!printOrder) return null;

    return (
        <div className="print-mode-label">
            <h1>{printOrder.orderNo || `KaratFlow #${printOrder.id}`}</h1>
            <p><strong>Design:</strong> {printOrder.design}</p>
            <p><strong>Date:</strong> {printOrder.date}</p>
            {printOrder.engravingText && (
                <div className="engraving-highlight">
                    각인: {printOrder.engravingText} ({printOrder.engravingLocation})
                </div>
            )}
        </div>
    );
};

export default PrintLabel;
