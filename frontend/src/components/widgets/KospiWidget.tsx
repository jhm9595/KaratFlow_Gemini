import React from 'react';

interface KospiWidgetProps {
    data: any;
}

const KospiWidget: React.FC<KospiWidgetProps> = ({ data }) => {
    return (
        <div className="flex flex-column gap-2 mt-2">
            <div className="text-sm text-500 mb-2">
                ※ KOSPI 일별시세 {data ? `(기준일: ${data.date})` : ''}
            </div>
            <div className="flex justify-content-between align-items-center">
                <span className="text-600">KOSPI</span>
                <span className="font-bold text-700">{data?.kospi ? data.kospi.toLocaleString() : '-'}</span>
            </div>
            <div className="flex justify-content-between align-items-center">
                <span className="text-600">KOSPI 200</span>
                <span className="font-bold text-700">{data?.kospi200 ? data.kospi200.toLocaleString() : '-'}</span>
            </div>
            <div className="flex justify-content-between align-items-center">
                <span className="text-600">코스피 거래대금</span>
                <span className="font-bold text-700">{data?.tradingValue ? `₩${(data.tradingValue / 100000000).toLocaleString(undefined, {maximumFractionDigits: 1})}억` : '-'}</span>
            </div>
        </div>
    );
};

export default KospiWidget;
