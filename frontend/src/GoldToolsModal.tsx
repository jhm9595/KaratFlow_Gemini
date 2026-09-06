import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';

interface GoldToolsProps {
    visible: boolean;
    onHide: () => void;
    recentPrices: any[]; // Data from daily_metal_price API
}

export const GoldToolsModal: React.FC<GoldToolsProps> = ({ visible, onHide, recentPrices }) => {
    // Current valid gold prices from props
    const todayGold = recentPrices && recentPrices.length > 0 
        ? recentPrices[recentPrices.length - 1] 
        : { price24k: 0, price18k: 0, price14k: 0 };

    // --- Tab 1: 실시간 시세 / 중량 계산 ---
    const [calcWeight, setCalcWeight] = useState<number>(3.75);
    const [calcPurity, setCalcPurity] = useState<string>('24K');
    const [weightUnit, setWeightUnit] = useState<string>('g'); // 'g' or 'don'
    
    // --- Tab 2: 고금 매입 계산기 ---
    const [scrapWeight, setScrapWeight] = useState<number>(3.75);
    const [scrapPurity, setScrapPurity] = useState<string>('18K');
    const [lossRate, setLossRate] = useState<number>(10); // 기본 해리 10%
    
    // --- Tab 3: 주물/합금 비율 계산 ---
    const [alloyPurity, setAlloyPurity] = useState<string>('18K');
    const [targetWeight, setTargetWeight] = useState<number>(10);

    const purityOptions = [
        { name: '24K', label: '24K (순금)' },
        { name: '18K', label: '18K' },
        { name: '14K', label: '14K' }
    ];

    const getPricePerGram = (purity: string) => {
        if (purity === '24K') return todayGold.price24k / 3.75;
        if (purity === '18K') return todayGold.price18k / 3.75;
        if (purity === '14K') return todayGold.price14k / 3.75;
        return 0;
    };

    // Calculate real-time value
    const currentPricePerG = getPricePerGram(calcPurity);
    const weightInGrams = weightUnit === 'g' ? calcWeight : calcWeight * 3.75;
    const estimatedValue = currentPricePerG * weightInGrams;

    // Calculate Scrap Value
    const scrapPricePerG = getPricePerGram(scrapPurity);
    const validScrapWeight = scrapWeight - (scrapWeight * (lossRate / 100));
    const scrapValue = scrapPricePerG * validScrapWeight;

    // Calculate Alloy Mix
    // 18K = 75% pure gold, 25% alloy. 14K = 58.5% pure gold, 41.5% alloy.
    const pureGoldRatio = alloyPurity === '18K' ? 0.75 : 0.585;
    const requiredPureGold = targetWeight * pureGoldRatio;
    const requiredAlloy = targetWeight - requiredPureGold;

    return (
        <Dialog header="금 시세 심층 도구 및 계산기" visible={visible} style={{ width: '50vw' }} onHide={onHide}>
            
            <div className="mb-4 p-3 surface-100 border-round">
                <p className="m-0 font-bold text-700">현재 시스템 기준 시세 (3.75g 기준)</p>
                <div className="flex gap-4 mt-2">
                    <div>24K: <span className="text-yellow-600 font-bold">{todayGold.price24k?.toLocaleString()}원</span></div>
                    <div>18K: <span className="text-orange-500 font-bold">{todayGold.price18k?.toLocaleString()}원</span></div>
                    <div>14K: <span className="text-purple-500 font-bold">{todayGold.price14k?.toLocaleString()}원</span></div>
                </div>
            </div>

            <TabView>
                <TabPanel header="중량별 시세 계산">
                    <div className="p-fluid grid">
                        <div className="col-12 md:col-4">
                            <label className="block mb-2 font-medium">품위 선택</label>
                            <Dropdown value={calcPurity} options={purityOptions} optionLabel="label" onChange={(e) => setCalcPurity(e.value)} />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="block mb-2 font-medium">단위</label>
                            <Dropdown value={weightUnit} options={[{label: '그램 (g)', value: 'g'}, {label: '돈 (3.75g)', value: 'don'}]} onChange={(e) => setWeightUnit(e.value)} />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="block mb-2 font-medium">중량 입력</label>
                            <InputNumber value={calcWeight} onValueChange={(e) => setCalcWeight(e.value || 0)} minFractionDigits={2} maxFractionDigits={3} />
                        </div>
                    </div>
                    
                    <div className="mt-4 p-4 surface-50 border-round text-center">
                        <span className="text-xl">예상 가치: </span>
                        <span className="text-3xl font-bold text-primary">{Math.round(estimatedValue).toLocaleString()}원</span>
                    </div>
                </TabPanel>
                
                <TabPanel header="고금(Scrap) 매입 계산">
                    <Message severity="info" text="해리(정제 손실)율을 적용하여 실제 매입 가치를 계산합니다." className="w-full mb-3" />
                    
                    <div className="p-fluid grid">
                        <div className="col-12 md:col-4">
                            <label className="block mb-2 font-medium">매입 품위</label>
                            <Dropdown value={scrapPurity} options={purityOptions} optionLabel="label" onChange={(e) => setScrapPurity(e.value)} />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="block mb-2 font-medium">중량 (g)</label>
                            <InputNumber value={scrapWeight} onValueChange={(e) => setScrapWeight(e.value || 0)} minFractionDigits={2} />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="block mb-2 font-medium">해리(%) 차감</label>
                            <InputNumber value={lossRate} onValueChange={(e) => setLossRate(e.value || 0)} suffix="%" />
                        </div>
                    </div>

                    <div className="mt-4 p-4 surface-50 border-round text-center">
                        <p className="m-0 mb-2 text-600">인정 중량: {validScrapWeight.toFixed(2)}g</p>
                        <span className="text-xl">매입 정산가: </span>
                        <span className="text-3xl font-bold text-green-600">{Math.round(scrapValue).toLocaleString()}원</span>
                    </div>
                </TabPanel>

                <TabPanel header="합금(Alloy) 비율 계산">
                    <Message severity="warn" text="순금(24K)을 사용하여 18K 또는 14K 주물을 만들 때 필요한 알로이 비율입니다." className="w-full mb-3" />
                    
                    <div className="p-fluid grid">
                        <div className="col-12 md:col-6">
                            <label className="block mb-2 font-medium">목표 품위 (캐스팅용)</label>
                            <Dropdown value={alloyPurity} options={purityOptions.filter(o => o.name !== '24K')} optionLabel="label" onChange={(e) => setAlloyPurity(e.value)} />
                        </div>
                        <div className="col-12 md:col-6">
                            <label className="block mb-2 font-medium">필요 총 중량 (g)</label>
                            <InputNumber value={targetWeight} onValueChange={(e) => setTargetWeight(e.value || 0)} minFractionDigits={2} />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                        <div className="flex-1 p-4 surface-50 border-round text-center border-1 border-yellow-300">
                            <div className="text-600 mb-2">필요 순금 (24K)</div>
                            <div className="text-2xl font-bold text-yellow-600">{requiredPureGold.toFixed(3)} g</div>
                        </div>
                        <div className="flex-1 p-4 surface-50 border-round text-center border-1 border-300">
                            <div className="text-600 mb-2">필요 알로이 (Alloy)</div>
                            <div className="text-2xl font-bold text-600">{requiredAlloy.toFixed(3)} g</div>
                        </div>
                    </div>
                </TabPanel>
            </TabView>

        </Dialog>
    );
};
