import React from 'react';

interface PrintLabelProps {
    printOrder: any;
}

const PrintLabel: React.FC<PrintLabelProps> = ({ printOrder }) => {
    if (!printOrder) return null;

    return (
        <div className="print-mode-label">
            <div style={{ borderBottom: '1px solid #000', paddingBottom: '1mm', marginBottom: '1mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '9pt' }}>KaratFlow</span>
                <span style={{ fontSize: '8pt', fontFamily: 'monospace' }}>{printOrder.orderNo || `KF-${printOrder.id}`}</span>
            </div>
            <div style={{ fontSize: '8pt', lineHeight: '1.3' }}>
                <div><strong>고객명:</strong> {printOrder.customerName || '-'}</div>
                <div><strong>브랜드:</strong> {printOrder.brand || '-'}</div>
                <div><strong>제품명:</strong> {printOrder.productName || printOrder.unmappedProductName || printOrder.design || '-'}</div>
                <div><strong>마감/수량:</strong> {printOrder.surfaceFinish || '유광'} / {printOrder.quantity || 1}개</div>
            </div>
            {printOrder.engravingText && (
                <div className="engraving-highlight">
                    각인: {printOrder.engravingText} {printOrder.engravingLocation ? `(${printOrder.engravingLocation})` : ''}
                </div>
            )}
        </div>
    );
};

export default PrintLabel;
