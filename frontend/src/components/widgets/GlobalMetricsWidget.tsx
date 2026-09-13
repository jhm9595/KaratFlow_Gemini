import React from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import PetroleumWidget from './PetroleumWidget';
import KospiWidget from './KospiWidget';

interface GlobalMetricsWidgetProps {
    globalMetrics: any;
}

const GlobalMetricsWidget: React.FC<GlobalMetricsWidgetProps> = ({ globalMetrics }) => {
    return (
        <div className="surface-0 p-3 border-round shadow-1 mt-3">
            <TabView>
                <TabPanel header="글로벌 지표 (현재가)">
                    <div className="flex flex-column gap-2 mt-2">
                        <div className="flex justify-content-between align-items-center">
                            <span className="text-600">백금 (Platinum)</span>
                            <span className="font-bold text-700">{globalMetrics?.platinum?.price ? `$${globalMetrics.platinum.price.toFixed(2)}` : '로딩중...'}</span>
                        </div>
                        <div className="flex justify-content-between align-items-center">
                            <span className="text-600">구리 (Copper)</span>
                            <span className="font-bold text-700">{globalMetrics?.copper?.price ? `$${globalMetrics.copper.price.toFixed(4)}` : '로딩중...'}</span>
                        </div>
                        <div className="flex justify-content-between align-items-center">
                            <span className="text-600">달러 인덱스 (DXY)</span>
                            <span className="font-bold text-700">{globalMetrics?.dxy?.price ? `${globalMetrics.dxy.price.toFixed(2)}` : '로딩중...'}</span>
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header="석유 (KRX)">
                    <PetroleumWidget data={globalMetrics?.petroleum} />
                </TabPanel>
                <TabPanel header="KOSPI (KRX)">
                    <KospiWidget data={globalMetrics?.kospi} />
                </TabPanel>
            </TabView>
        </div>
    );
};

export default GlobalMetricsWidget;
