import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

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

    // --- Tab 1: 중량별 시세 계산 ---
    const [calcWeight, setCalcWeight] = useState<number | string>(3.75);
    const [calcPurity, setCalcPurity] = useState<string>('24K');
    const [weightUnit, setWeightUnit] = useState<string>('g');

    // --- Tab 2: 고금 매입 계산 ---
    const [scrapWeight, setScrapWeight] = useState<number | string>(3.75);
    const [scrapPurity, setScrapPurity] = useState<string>('18K');
    const [lossRate, setLossRate] = useState<number | string>(10);

    // --- Tab 3: 합금(Alloy) 비율 계산 ---
    const [alloyPurity, setAlloyPurity] = useState<string>('18K');
    const [targetWeight, setTargetWeight] = useState<number | string>(10);

    const purityOptions = [
        { name: '24K', label: '24K (순금)' },
        { name: '18K', label: '18K (75.0%)' },
        { name: '14K', label: '14K (58.5%)' }
    ];

    const getPricePerGram = (purity: string) => {
        if (purity === '24K') return (todayGold.price24k || 0) / 3.75;
        if (purity === '18K') return (todayGold.price18k || 0) / 3.75;
        if (purity === '14K') return (todayGold.price14k || 0) / 3.75;
        return 0;
    };

    // Calculate real-time value
    const currentPricePerG = getPricePerGram(calcPurity);
    const numCalcWeight = Number(calcWeight) || 0;
    const weightInGrams = weightUnit === 'g' ? numCalcWeight : numCalcWeight * 3.75;
    const estimatedValue = currentPricePerG * weightInGrams;

    // Calculate Scrap Value
    const scrapPricePerG = getPricePerGram(scrapPurity);
    const numScrapWeight = Number(scrapWeight) || 0;
    const numLossRate = Number(lossRate) || 0;
    const validScrapWeight = numScrapWeight - (numScrapWeight * (numLossRate / 100));
    const scrapValue = scrapPricePerG * validScrapWeight;

    // Calculate Alloy Mix
    const numTargetWeight = Number(targetWeight) || 0;
    const pureGoldRatio = alloyPurity === '18K' ? 0.75 : 0.585;
    const requiredPureGold = numTargetWeight * pureGoldRatio;
    const requiredAlloy = numTargetWeight - requiredPureGold;

    return (
        <Dialog 
            header={
                <div className="flex align-items-center gap-2">
                    <div className="bg-yellow-100 border-circle w-2rem h-2rem flex align-items-center justify-content-center">
                        <i className="pi pi-calculator text-yellow-700 text-lg"></i>
                    </div>
                    <span className="font-bold text-xl text-900">금 시세 계산 도구</span>
                </div>
            } 
            visible={visible} 
            style={{ width: '740px', maxWidth: '95vw' }} 
            contentStyle={{ padding: '1rem 1.5rem 1.5rem 1.5rem', minHeight: '440px' }}
            onHide={onHide}
            dismissableMask
            resizable={false}
        >
            {/* Top Market Bar - Modern Compact Banner */}
            <div className="bg-yellow-50 border-1 border-yellow-200 border-round-xl p-3 mb-3 flex flex-wrap justify-content-between align-items-center gap-3">
                <div className="text-800 font-bold text-sm flex align-items-center gap-2" style={{ whiteSpace: 'nowrap' }}>
                    <i className="pi pi-chart-line text-yellow-600 text-base"></i>
                    <span>라이브 금 시세</span>
                    <span className="text-500 text-xs font-normal">(한돈 3.75g 기준)</span>
                </div>
                <div className="flex align-items-center gap-3 text-sm" style={{ whiteSpace: 'nowrap' }}>
                    <div className="bg-white border-1 border-yellow-300 border-round-lg px-2 py-1 shadow-1">
                        <span className="text-600 text-xs font-medium">24K:</span>
                        <span className="text-yellow-800 font-bold ml-1 font-mono">₩{todayGold.price24k?.toLocaleString()}</span>
                    </div>
                    <div className="bg-white border-1 border-yellow-300 border-round-lg px-2 py-1 shadow-1">
                        <span className="text-600 text-xs font-medium">18K:</span>
                        <span className="text-orange-700 font-bold ml-1 font-mono">₩{todayGold.price18k?.toLocaleString()}</span>
                    </div>
                    <div className="bg-white border-1 border-yellow-300 border-round-lg px-2 py-1 shadow-1">
                        <span className="text-600 text-xs font-medium">14K:</span>
                        <span className="text-purple-700 font-bold ml-1 font-mono">₩{todayGold.price14k?.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Tab Container */}
            <TabView className="custom-gold-tabs">
                
                {/* Tab 1 */}
                <TabPanel 
                    header={
                        <span className="flex align-items-center gap-2 font-bold">
                            <i className="pi pi-dollar"></i> 중량별 시세 계산
                        </span>
                    }
                >
                    <div className="pt-3">
                        <div className="p-fluid grid">
                            <div className="col-12 md:col-4">
                                <label className="block mb-2 font-bold text-700 text-sm flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
                                    품위 선택
                                    <i className="pi pi-question-circle text-400 text-xs ml-1" title="계산할 금 순도(24K, 18K, 14K)를 선택합니다."></i>
                                </label>
                                <Dropdown value={calcPurity} options={purityOptions} optionLabel="label" optionValue="name" onChange={(e) => setCalcPurity(e.value)} />
                            </div>
                            <div className="col-12 md:col-4">
                                <label className="block mb-2 font-bold text-700 text-sm flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
                                    단위 선택
                                    <i className="pi pi-question-circle text-400 text-xs ml-1" title="그램(g) 또는 돈(3.75g) 단위를 선택합니다."></i>
                                </label>
                                <Dropdown value={weightUnit} options={[{label: '그램 (g)', value: 'g'}, {label: '돈 (3.75g)', value: 'don'}]} onChange={(e) => setWeightUnit(e.value)} />
                            </div>
                            <div className="col-12 md:col-4">
                                <label className="block mb-2 font-bold text-700 text-sm flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
                                    중량 입력
                                    <i className="pi pi-question-circle text-400 text-xs ml-1" title="계산 대상 중량을 수치로 입력합니다."></i>
                                </label>
                                <InputText type="number" value={calcWeight.toString()} onChange={(e) => setCalcWeight(e.target.value)} step="0.01" />
                            </div>
                        </div>

                        {/* Result Card */}
                        <div className="mt-4 surface-50 border-1 border-primary-200 border-round-xl p-4 text-center shadow-1">
                            <div className="text-600 font-bold mb-1 text-sm">실시간 예상 총 가치</div>
                            <div className="text-4xl font-extrabold text-primary font-mono mb-1">
                                ₩{Math.round(estimatedValue).toLocaleString()}
                            </div>
                            <div className="text-500 text-xs font-medium">(환산 중량: {weightInGrams.toFixed(2)}g)</div>
                        </div>
                    </div>
                </TabPanel>

                {/* Tab 2 */}
                <TabPanel 
                    header={
                        <span className="flex align-items-center gap-2 font-bold">
                            <i className="pi pi-refresh"></i> 고금 매입 계산
                        </span>
                    }
                >
                    <div className="pt-3">
                        <div className="p-fluid grid">
                            <div className="col-12 md:col-4">
                                <label className="block mb-2 font-bold text-700 text-sm flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
                                    매입 품위
                                    <i className="pi pi-question-circle text-400 text-xs ml-1" title="매입할 고금(Scrap)의 순도를 선택합니다."></i>
                                </label>
                                <Dropdown value={scrapPurity} options={purityOptions} optionLabel="label" optionValue="name" onChange={(e) => setScrapPurity(e.value)} />
                            </div>
                            <div className="col-12 md:col-4">
                                <label className="block mb-2 font-bold text-700 text-sm flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
                                    실측 중량 (g)
                                    <i className="pi pi-question-circle text-400 text-xs ml-1" title="저울로 측정한 고금의 실제 무게(g)입니다."></i>
                                </label>
                                <InputText type="number" value={scrapWeight.toString()} onChange={(e) => setScrapWeight(e.target.value)} step="0.01" />
                            </div>
                            <div className="col-12 md:col-4">
                                <label className="block mb-2 font-bold text-700 text-sm flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
                                    해리율 (%)
                                    <i className="pi pi-question-circle text-400 text-xs ml-1" title="정제 손실 및 불순물 차감 비율(%)(기본 10%)"></i>
                                </label>
                                <div className="p-inputgroup">
                                    <InputText type="number" value={lossRate.toString()} onChange={(e) => setLossRate(e.target.value)} />
                                    <span className="p-inputgroup-addon">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Result Card */}
                        <div className="mt-4 surface-50 border-1 border-green-200 border-round-xl p-4 text-center shadow-1">
                            <div className="flex justify-content-center gap-4 text-sm text-600 mb-2">
                                <span>차감 감모량: <strong className="text-red-500">{(numScrapWeight * (numLossRate / 100)).toFixed(2)}g</strong></span>
                                <span className="border-left-1 border-300 pl-4">인정 실중량: <strong className="text-900">{validScrapWeight.toFixed(2)}g</strong></span>
                            </div>
                            <div className="text-xs font-bold text-green-700 mb-1">최종 매입 정산가</div>
                            <div className="text-4xl font-extrabold text-green-600 font-mono">
                                ₩{Math.round(scrapValue).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </TabPanel>

                {/* Tab 3 */}
                <TabPanel 
                    header={
                        <span className="flex align-items-center gap-2 font-bold">
                            <i className="pi pi-sliders-h"></i> 합금(Alloy) 비율 계산
                        </span>
                    }
                >
                    <div className="pt-3">
                        <div className="p-fluid grid">
                            <div className="col-12 md:col-6">
                                <label className="block mb-2 font-bold text-700 text-sm flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
                                    목표 품위
                                    <i className="pi pi-question-circle text-400 text-xs ml-1" title="주물(캐스팅) 제작 목표 순도(18K: 75%, 14K: 58.5%)"></i>
                                </label>
                                <Dropdown value={alloyPurity} options={purityOptions.filter(o => o.name !== '24K')} optionLabel="label" optionValue="name" onChange={(e) => setAlloyPurity(e.value)} />
                            </div>
                            <div className="col-12 md:col-6">
                                <label className="block mb-2 font-bold text-700 text-sm flex align-items-center" style={{ whiteSpace: 'nowrap' }}>
                                    목표 총중량 (g)
                                    <i className="pi pi-question-circle text-400 text-xs ml-1" title="합금 후 완성하려는 총 중량(g)입니다."></i>
                                </label>
                                <InputText type="number" value={targetWeight.toString()} onChange={(e) => setTargetWeight(e.target.value)} step="0.01" />
                            </div>
                        </div>

                        {/* Result Card Grid */}
                        <div className="mt-4 grid">
                            <div className="col-6">
                                <div className="p-3 bg-yellow-50 border-round-xl border-1 border-yellow-300 text-center shadow-1">
                                    <div className="text-yellow-900 font-bold text-xs mb-1">필요 순금 (24K)</div>
                                    <div className="text-3xl font-extrabold text-yellow-700 font-mono">{requiredPureGold.toFixed(3)} g</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-3 surface-100 border-round-xl border-1 border-300 text-center shadow-1">
                                    <div className="text-700 font-bold text-xs mb-1">필요 알로이 (Alloy)</div>
                                    <div className="text-3xl font-extrabold text-700 font-mono">{requiredAlloy.toFixed(3)} g</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

            </TabView>
        </Dialog>
    );
};
