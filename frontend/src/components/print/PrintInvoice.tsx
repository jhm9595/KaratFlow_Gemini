import React from 'react';

interface PrintInvoiceProps {
    printOrder: any;
}

const PrintInvoice: React.FC<PrintInvoiceProps> = ({ printOrder }) => {
    if (!printOrder) return null;

    return (
        <div className="print-mode-invoice">
            <h1>{printOrder.orderType === 'B2B' ? '거래명세표 (도매용)' : '품질보증서 (고객용)'}</h1>
            
            <p><strong>주문번호:</strong> {printOrder.orderNo || `KF-${printOrder.id}`}</p>
            <p><strong>고객/업체명:</strong> {printOrder.customerName || '지정되지 않음'}</p>
            <p><strong>연락처:</strong> {printOrder.customerPhone || '지정되지 않음'}</p>
            <p><strong>주문일자:</strong> {printOrder.date}</p>

            <table>
                <thead>
                    <tr>
                        <th>제품코드 (디자인)</th>
                        <th>표면 마감</th>
                        <th>각인 내용</th>
                        {printOrder.orderType === 'B2C' && <th>소비자가격</th>}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{printOrder.design}</td>
                        <td>{printOrder.surfaceFinish || '기본'}</td>
                        <td>{printOrder.engravingText || '없음'}</td>
                        {printOrder.orderType === 'B2C' && <td>{printOrder.finalConsumerPrice ? printOrder.finalConsumerPrice.toLocaleString() + '원' : '별도 문의'}</td>}
                    </tr>
                </tbody>
            </table>

            {printOrder.invoice && printOrder.orderType === 'B2B' && (
                <div style={{ marginTop: '20mm', border: '1px solid #000', padding: '10px' }}>
                    <h3>정산 상세 (B2B 전용)</h3>
                    <p><strong>적용 금 시세:</strong> ₩{printOrder.invoice.goldPricePer375g?.toLocaleString()} (기준일: {printOrder.invoice.priceDate})</p>
                    <p><strong>출고 실측 중량:</strong> {printOrder.invoice.completedWeightG}g / <strong>스톤 중량:</strong> {printOrder.invoice.stoneWeightG}g</p>
                    <p><strong>정산 기준 중량 (해리율 {printOrder.invoice.lossRatePercent}%):</strong> {printOrder.invoice.settlementBaseWeightG?.toFixed(3)}g</p>
                    <p><strong>금 청구액:</strong> ₩{printOrder.invoice.calculatedGoldPrice?.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                    <p><strong>원청 공임:</strong> ₩{printOrder.invoice.baseLaborFee?.toLocaleString()}</p>
                    <p><strong>스톤비:</strong> ₩{printOrder.invoice.stoneFee?.toLocaleString()}</p>
                    <h2 style={{ marginTop: '10px', color: '#b91c1c' }}>최종 청구액: ₩{printOrder.invoice.finalBillingAmount?.toLocaleString(undefined, {maximumFractionDigits:0})}</h2>
                </div>
            )}
            
            {printOrder.orderType === 'B2B' && (
                <div style={{ marginTop: '30mm' }}>
                    <p>위 금액을 영수함. (공급자 서명: _______________ )</p>
                </div>
            )}
            
            {printOrder.orderType === 'B2C' && (
                <div style={{ marginTop: '30mm', textAlign: 'center' }}>
                    <p>본 제품은 엄격한 품질관리를 거쳐 제작되었음을 보증합니다.</p>
                    <p><strong>KaratFlow Jewelry</strong></p>
                </div>
            )}
        </div>
    );
};

export default PrintInvoice;
