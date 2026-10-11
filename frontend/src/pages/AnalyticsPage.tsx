import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { SelectButton } from 'primereact/selectbutton';
import { Toast } from 'primereact/toast';

export const AnalyticsPage: React.FC = () => {
    const toast = useRef<Toast>(null);

    // Period Mode: 'monthly' | 'yearly' | 'custom'
    const [periodType, setPeriodType] = useState<string>('monthly');
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [selectedMonth, setSelectedMonth] = useState<number>(10);
    const [dateRange, setDateRange] = useState<any>([new Date(2026, 8, 15), new Date(2026, 9, 5)]);

    const periodOptions = [
        { label: '월간 정산', value: 'monthly' },
        { label: '연간 정산', value: 'yearly' },
        { label: '자유 기간 지정', value: 'custom' }
    ];

    const yearOptions = [
        { label: '2026년', value: 2026 },
        { label: '2025년', value: 2025 },
        { label: '2024년', value: 2024 }
    ];

    const monthOptions = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}월`, value: i + 1 }));

    const [settlementData, setSettlementData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    React.useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        fetch('http://localhost:8888/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            setLoading(false);
            if (Array.isArray(data)) {
                // Group by customer store name
                const map: { [key: string]: any } = {};
                data.forEach((ord: any) => {
                    const store = ord.storeName || ord.customerName || '기타 거래처';
                    if (!map[store]) {
                        map[store] = {
                            id: store,
                            customerName: store,
                            orderCount: 0,
                            completedCount: 0,
                            gold24k: 0,
                            gold18k: 0,
                            gold14k: 0,
                            totalRevenue: 0
                        };
                    }
                    map[store].orderCount += 1;
                    if (ord.status === 'COMPLETED' || ord.status === '완료') {
                        map[store].completedCount += 1;
                    }
                    const rev = Number(ord.totalPrice || ord.price || 0);
                    map[store].totalRevenue += rev;
                });
                setSettlementData(Object.values(map));
            }
        })
        .catch(err => {
            console.error('Failed to fetch settlement data:', err);
            setLoading(false);
        });
    }, []);

    const totalOrders = settlementData.reduce((acc, curr) => acc + curr.orderCount, 0);
    const totalRevenue = settlementData.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const total24kGrams = settlementData.reduce((acc, curr) => acc + (curr.gold24k || 0), 0);
    const total18kGrams = settlementData.reduce((acc, curr) => acc + (curr.gold18k || 0), 0);
    const total14kGrams = settlementData.reduce((acc, curr) => acc + (curr.gold14k || 0), 0);

    const exportExcel = () => {
        toast.current?.show({ severity: 'success', summary: '엑셀 다운로드', detail: '정산 명세서 엑셀 파일(.xlsx)이 다운로드되었습니다.', life: 3000 });
    };

    const printStatement = () => {
        window.print();
    };

    return (
        <div className="p-4 surface-ground min-h-screen">
            <Toast ref={toast} />
            
            {/* Header & Period Filter Controls */}
            <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                    <h2 className="text-900 font-bold m-0 flex align-items-center gap-2">
                        <i className="pi pi-chart-bar text-green-600 text-2xl"></i>
                        전체 통계 및 마감 정산
                    </h2>
                    <p className="text-500 text-sm mt-1 mb-0">
                        월간·연간·자유 기간별 매출 정산 및 금 중량(24K/18K/14K) 사용량 집계
                    </p>
                </div>
                
                <div className="flex align-items-center gap-2">
                    <Button label="명세서 인쇄" icon="pi pi-print" className="p-button-outlined p-button-secondary p-button-sm" onClick={printStatement} />
                    <Button label="엑셀 다운로드" icon="pi pi-file-excel" className="p-button-success p-button-sm shadow-1" onClick={exportExcel} />
                </div>
            </div>

            {/* Period Selection Bar */}
            <Card className="mb-4 border-round-xl shadow-1">
                <div className="flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="flex align-items-center gap-2">
                        <span className="font-bold text-700 text-sm mr-2">정산 기간 선택:</span>
                        <SelectButton value={periodType} options={periodOptions} onChange={(e) => e.value && setPeriodType(e.value)} className="p-button-sm" />
                    </div>

                    <div className="flex align-items-center gap-2">
                        {periodType === 'monthly' && (
                            <>
                                <Dropdown value={selectedYear} options={yearOptions} onChange={(e) => setSelectedYear(e.value)} className="p-inputtext-sm" />
                                <Dropdown value={selectedMonth} options={monthOptions} onChange={(e) => setSelectedMonth(e.value)} className="p-inputtext-sm" />
                            </>
                        )}
                        {periodType === 'yearly' && (
                            <Dropdown value={selectedYear} options={yearOptions} onChange={(e) => setSelectedYear(e.value)} className="p-inputtext-sm" />
                        )}
                        {periodType === 'custom' && (
                            <Calendar value={dateRange} onChange={(e) => setDateRange(e.value)} selectionMode="range" readOnlyInput placeholder="시작일 ~ 종료일 선택" className="p-inputtext-sm" />
                        )}
                    </div>
                </div>
            </Card>

            {/* Summary KPI Cards */}
            <div className="grid mb-4">
                <div className="col-12 md:col-3">
                    <div className="surface-0 p-3 border-round-xl border-1 border-200 shadow-1">
                        <div className="text-500 font-bold text-xs mb-1">총 정산 금액</div>
                        <div className="text-2xl font-extrabold text-green-600 font-mono">₩{totalRevenue.toLocaleString()}</div>
                    </div>
                </div>
                <div className="col-12 md:col-3">
                    <div className="surface-0 p-3 border-round-xl border-1 border-200 shadow-1">
                        <div className="text-500 font-bold text-xs mb-1">총 처리 주문 건수</div>
                        <div className="text-2xl font-extrabold text-primary font-mono">{totalOrders}건</div>
                    </div>
                </div>
                <div className="col-12 md:col-3">
                    <div className="surface-0 p-3 border-round-xl border-1 border-yellow-300 bg-yellow-50 shadow-1">
                        <div className="text-yellow-900 font-bold text-xs mb-1">24K 순금 사용량</div>
                        <div className="text-2xl font-extrabold text-yellow-700 font-mono">{total24kGrams.toFixed(2)} g <span className="text-xs font-normal">({(total24kGrams / 3.75).toFixed(1)}돈)</span></div>
                    </div>
                </div>
                <div className="col-12 md:col-3">
                    <div className="surface-0 p-3 border-round-xl border-1 border-orange-200 bg-orange-50 shadow-1">
                        <div className="text-orange-900 font-bold text-xs mb-1">18K / 14K 합금 사용량</div>
                        <div className="text-2xl font-extrabold text-orange-700 font-mono">{(total18kGrams + total14kGrams).toFixed(2)} g</div>
                    </div>
                </div>
            </div>

            {/* Settlement Table by Customer */}
            <Card className="border-round-xl shadow-1">
                <div className="flex align-items-center justify-content-between mb-3">
                    <h3 className="m-0 text-900 font-bold text-base">거래처(소매점)별 정산 및 금 중량 내역</h3>
                    <span className="text-500 text-xs">선택 기간 기준 정산 결과</span>
                </div>
                <DataTable value={settlementData} size="small" paginator rows={10} responsiveLayout="scroll">
                    <Column field="customerName" header="거래처명 (소매점)" body={(r) => <span className="font-bold text-primary">{r.customerName}</span>} />
                    <Column field="orderCount" header="총 주문" body={(r) => <span>{r.orderCount}건</span>} />
                    <Column field="completedCount" header="완료 건수" body={(r) => <span className="font-bold text-green-600">{r.completedCount}건</span>} />
                    <Column field="gold24k" header="24K (g)" body={(r) => <span className="font-mono">{r.gold24k.toFixed(2)}g</span>} />
                    <Column field="gold18k" header="18K (g)" body={(r) => <span className="font-mono">{r.gold18k.toFixed(2)}g</span>} />
                    <Column field="gold14k" header="14K (g)" body={(r) => <span className="font-mono">{r.gold14k.toFixed(2)}g</span>} />
                    <Column field="totalRevenue" header="정산 금액" body={(r) => <span className="font-extrabold text-900 font-mono">₩{r.totalRevenue.toLocaleString()}</span>} />
                </DataTable>
            </Card>
        </div>
    );
};
