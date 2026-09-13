import React from 'react';

interface PetroleumWidgetProps {
    data: any;
}

const PetroleumWidget: React.FC<PetroleumWidgetProps> = ({ data }) => {
    return (
        <div className="flex flex-column gap-2 mt-2">
            <div className="text-sm text-500 mb-2">
                ※ KRX 석유시장 일별매매 {data ? `(기준일: ${data.date})` : ''}
            </div>
            <div className="flex justify-content-between align-items-center">
                <span className="text-600">휘발유 (경쟁가)</span>
                <span className="font-bold text-700">{data?.gasoline ? `₩${data.gasoline.toLocaleString()}/L` : '-'}</span>
            </div>
            <div className="flex justify-content-between align-items-center">
                <span className="text-600">경유 (경쟁가)</span>
                <span className="font-bold text-700">{data?.diesel ? `₩${data.diesel.toLocaleString()}/L` : '-'}</span>
            </div>
            <div className="flex justify-content-between align-items-center">
                <span className="text-600">등유 (경쟁가)</span>
                <span className="font-bold text-700">{data?.kerosene ? `₩${data.kerosene.toLocaleString()}/L` : '-'}</span>
            </div>
        </div>
    );
};

export default PetroleumWidget;
