import React from 'react';

interface PrintInvoiceProps {
    printOrder: any;
}

const PrintInvoice: React.FC<PrintInvoiceProps> = ({ printOrder }) => {
    if (!printOrder) return null;

    return (
        <div className="print-mode-invoice">
            {/* Header Metadata Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9pt', color: '#444', marginBottom: '4mm' }}>
                <span style={{ fontWeight: 'bold' }}>[서식 제2026-KF09호]</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>문서관리번호: KF-DOC-{printOrder.id}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}</span>
            </div>

            {/* Main Document Title */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', borderBottom: '3px double #000', paddingBottom: '4mm' }}>
                <h1 style={{ fontSize: '22pt', margin: 0, letterSpacing: '4px', fontWeight: 'bold', color: '#000' }}>
                    {printOrder.orderType === 'B2B' ? '공 식 거 래 명 세 표 ( 도 매 용 )' : '품 질 보 증 서 및 정 산 명 세 서'}
                </h1>
                <div style={{ fontSize: '9.5pt', color: '#555', marginTop: '2mm', letterSpacing: '0.5px' }}>
                    ( 귀금속 통합 제작 공정 관리 시스템 K-APM 공식 인증 문서 )
                </div>
            </div>
            
            {/* Legal Provider / Receiver Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '9.5pt' }}>
                <tbody>
                    <tr>
                        <th rowSpan={4} style={{ width: '4%', backgroundColor: '#f1f3f5', border: '1px solid #000', textAlign: 'center', writingMode: 'vertical-rl', letterSpacing: '3px' }}>공급자</th>
                        <td style={{ width: '13%', backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>사업자번호</td>
                        <td style={{ width: '33%', border: '1px solid #000', padding: '5px 8px' }}>124-81-99881</td>
                        <th rowSpan={4} style={{ width: '4%', backgroundColor: '#f1f3f5', border: '1px solid #000', textAlign: 'center', writingMode: 'vertical-rl', letterSpacing: '3px' }}>공급받는자</th>
                        <td style={{ width: '13%', backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>주문번호</td>
                        <td style={{ width: '33%', border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', color: '#1d4ed8' }}>{printOrder.orderNo || `KF-${printOrder.id}`}</td>
                    </tr>
                    <tr>
                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>상호(법인명)</td>
                        <td style={{ border: '1px solid #000', padding: '5px 8px' }}>KaratFlow Jewelry (주)</td>
                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>성명 / 상호</td>
                        <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>{printOrder.customerName || '지정되지 않음'}</td>
                    </tr>
                    <tr>
                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>성명(대표자)</td>
                        <td style={{ border: '1px solid #000', padding: '5px 8px' }}>홍 길 동 (인)</td>
                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>연락처</td>
                        <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{printOrder.customerPhone || '-'}</td>
                    </tr>
                    <tr>
                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>사업장 주소</td>
                        <td style={{ border: '1px solid #000', padding: '5px 8px' }}>서울시 종로구 돈화문로 11길 15</td>
                        <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px 8px' }}>발행일시</td>
                        <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{new Date().toLocaleString('ko-KR')}</td>
                    </tr>
                </tbody>
            </table>

            {/* Table of Items */}
            <div style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '2mm', display: 'flex', justifyContent: 'space-between', borderLeft: '3px solid #000', paddingLeft: '6px' }}>
                <span>1. 품목 및 주문 규격 명세</span>
                <span style={{ fontSize: '9pt', fontWeight: 'normal', color: '#666' }}>단위: 원(KRW), VAT 포함</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '9.5pt' }}>
                <thead>
                    <tr style={{ backgroundColor: '#e9ecef', textAlign: 'center' }}>
                        <th style={{ border: '1px solid #000', padding: '6px', width: '6%' }}>No.</th>
                        <th style={{ border: '1px solid #000', padding: '6px', width: '14%' }}>브랜드</th>
                        <th style={{ border: '1px solid #000', padding: '6px', width: '28%' }}>품명 및 디자인 규격</th>
                        <th style={{ border: '1px solid #000', padding: '6px', width: '12%' }}>표면 마감</th>
                        <th style={{ border: '1px solid #000', padding: '6px', width: '20%' }}>각인 문구 (위치)</th>
                        <th style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>수량</th>
                        <th style={{ border: '1px solid #000', padding: '6px', width: '12%' }}>금액</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ textAlign: 'center' }}>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>1</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{printOrder.brand || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                            <strong>{printOrder.productName || printOrder.unmappedProductName || printOrder.design || '-'}</strong>
                        </td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{printOrder.surfaceFinish || '유광'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                            {printOrder.engravingText ? `${printOrder.engravingText} (${printOrder.engravingLocation || '기본'})` : '없음'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{printOrder.quantity || 1} EA</td>
                        <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                            {printOrder.finalConsumerPrice ? `₩${printOrder.finalConsumerPrice.toLocaleString()}` : '-'}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                        <td colSpan={5} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>합 계 (TOTAL)</td>
                        <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{printOrder.quantity || 1} EA</td>
                        <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', color: '#166534', fontSize: '10.5pt' }}>
                            {printOrder.finalConsumerPrice ? `₩${printOrder.finalConsumerPrice.toLocaleString()}` : '-'}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* B2B Detailed Gold & Labor Settlement Block */}
            {printOrder.invoice && printOrder.orderType === 'B2B' && (
                <div style={{ marginBottom: '6mm' }}>
                    <div style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '2mm', borderLeft: '3px solid #000', paddingLeft: '6px' }}>2. B2B 정밀 귀금속 및 공임 정산 명세</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                        <tbody>
                            <tr>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', width: '20%', padding: '5px' }}>적용 시세 (기준일)</td>
                                <td style={{ border: '1px solid #000', width: '30%', padding: '5px' }}>₩{printOrder.invoice.goldPricePer375g?.toLocaleString()} / 3.75g ({printOrder.invoice.priceDate})</td>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', width: '20%', padding: '5px' }}>출고 실측 중량</td>
                                <td style={{ border: '1px solid #000', width: '30%', padding: '5px' }}>{printOrder.invoice.completedWeightG} g</td>
                            </tr>
                            <tr>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>스톤 차감 중량</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>{printOrder.invoice.stoneWeightG} g</td>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>정산 기준 중량 (해리 {printOrder.invoice.lossRatePercent}%)</td>
                                <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>{printOrder.invoice.settlementBaseWeightG?.toFixed(3)} g</td>
                            </tr>
                            <tr>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>산출 금 재료비</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>₩{printOrder.invoice.calculatedGoldPrice?.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>원청 기본 공임비</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>₩{printOrder.invoice.baseLaborFee?.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style={{ backgroundColor: '#fafafa', border: '1px solid #000', fontWeight: 'bold', padding: '5px' }}>스톤 세팅 공임비</td>
                                <td style={{ border: '1px solid #000', padding: '5px' }}>₩{printOrder.invoice.stoneFee?.toLocaleString()}</td>
                                <td style={{ backgroundColor: '#fee2e2', border: '1px solid #000', fontWeight: 'bold', padding: '5px', color: '#991b1b' }}>최종 정산 청구 금액</td>
                                <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', fontSize: '11pt', color: '#991b1b' }}>
                                    ₩{printOrder.invoice.finalBillingAmount?.toLocaleString(undefined, {maximumFractionDigits:0})} 원
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Legal Quality Assurance & Official Stamp Box */}
            <div style={{ border: '2px solid #000', padding: '6mm', marginTop: '6mm', backgroundColor: '#ffffff', position: 'relative' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11pt', marginBottom: '3mm', letterSpacing: '2px' }}>
                    [ 품 질 보 증 및 서 명 직 인 ]
                </div>
                <p style={{ fontSize: '9pt', lineHeight: '1.6', color: '#333', textAlign: 'justify', margin: 0 }}>
                    본 문서는 귀금속 통합 제작 공정 시스템(KaratFlow APM System)에서 공정별 정밀 검수 완료 후 공식 발행된 서류입니다.
                    본 서류에 기재된 순도, 실측 중량 및 제품 사양은 국가 표준 귀금속 품질 보증 규정에 의거하여 정품임을 철저히 보증하며, 무단 복제 및 변조를 금합니다.
                </p>
                
                <div style={{ marginTop: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '9.5pt' }}>
                        <div><strong>발행일자:</strong> {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div><strong>발행기관:</strong> KaratFlow Jewelry 주식회사</div>
                    </div>
                    
                    {/* Red Official Seal Graphic / Stamp Container */}
                    <div style={{ textAlign: 'right', position: 'relative', paddingRight: '10px' }}>
                        <div style={{ fontSize: '11pt', fontWeight: 'bold', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <span>발행원 / 대표이사 홍 길 동</span>
                            <span style={{ 
                                display: 'inline-block', 
                                width: '42px', 
                                height: '42px', 
                                borderRadius: '50%', 
                                border: '2px double #dc2626', 
                                color: '#dc2626', 
                                fontSize: '9pt', 
                                fontWeight: 'bold', 
                                lineHeight: '38px', 
                                textAlign: 'center',
                                transform: 'rotate(-5deg)'
                            }}>
                                직인
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default PrintInvoice;
