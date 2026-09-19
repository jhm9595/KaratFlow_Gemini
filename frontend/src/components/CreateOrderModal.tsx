import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { AutoComplete } from 'primereact/autocomplete';

interface CreateOrderModalProps {
    visible: boolean;
    onHide: () => void;
    createOrderForm: any;
    setCreateOrderForm: React.Dispatch<React.SetStateAction<any>>;
    selectedProduct: any;
    setSelectedProduct: (val: any) => void;
    filteredProducts: any[];
    searchProduct: (e: { query: string }) => void;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    submitCreateOrder: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
    visible, onHide, createOrderForm, setCreateOrderForm, selectedProduct, setSelectedProduct,
    filteredProducts, searchProduct, handleFileUpload, submitCreateOrder
}) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8888';

    return (
        <Dialog 
            header="새 주문 생성" 
            visible={visible} 
            style={{ width: '60vw' }} 
            breakpoints={{ '960px': '85vw', '641px': '100vw' }} 
            onHide={onHide} 
            className="p-fluid"
            dismissableMask
        >
            <div className="formgrid grid mt-2">
                {(!selectedProduct || typeof selectedProduct === 'string') && (
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">브랜드 (옵션)</label>
                        <InputText 
                            value={createOrderForm.unmappedBrandName} 
                            onChange={(e) => setCreateOrderForm({ ...createOrderForm, unmappedBrandName: e.target.value })} 
                            placeholder="신규 브랜드명" 
                        />
                    </div>
                )}
                <div className="field col-12 md:col-6">
                    <label className="font-bold">제품 검색 (또는 직접 입력) <span className="text-red-500">*</span></label>
                    <AutoComplete 
                        value={selectedProduct} 
                        suggestions={filteredProducts} 
                        completeMethod={searchProduct} 
                        field="name" 
                        onChange={(e) => {
                            setSelectedProduct(e.value);
                            if (typeof e.value === 'object' && e.value !== null) {
                                setCreateOrderForm({ ...createOrderForm, designId: e.value.id, unmappedProductName: '', unmappedBrandName: '' });
                            } else if (typeof e.value === 'string') {
                                setCreateOrderForm({ ...createOrderForm, designId: 0, unmappedProductName: e.value });
                            }
                        }} 
                        itemTemplate={(item: any) => (
                            <div className="flex align-items-center gap-2">
                                {item.imageUrl && (
                                    <img 
                                        src={`${apiUrl}${item.imageUrl}`} 
                                        alt={item.name} 
                                        style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} 
                                    />
                                )}
                                <div>
                                    <div className="font-bold text-sm">{item.brand} - {item.name}</div>
                                    <div className="text-xs text-500">{item.designCode}</div>
                                </div>
                            </div>
                        )}
                        placeholder="검색 또는 입력" 
                    />
                </div>
                
                <div className="field col-12 md:col-6">
                    <label className="font-bold">제품 이미지</label>
                    <div className="flex align-items-center gap-2">
                        <input 
                            type="file" 
                            onChange={handleFileUpload} 
                            accept="image/*" 
                            className="p-inputtext p-component flex-1" 
                            style={{ padding: '0.5rem' }} 
                        />
                        {createOrderForm.imageUrl && (
                            <img 
                                src={`${apiUrl}${createOrderForm.imageUrl}`} 
                                alt="preview" 
                                className="shadow-2 border-round" 
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                            />
                        )}
                    </div>
                </div>

                <div className="field col-12 md:col-6">
                    <label className="font-bold">수량</label>
                    <InputNumber 
                        value={createOrderForm.quantity} 
                        onValueChange={(e) => setCreateOrderForm({ ...createOrderForm, quantity: (e.value === null || e.value === undefined) ? 1 : e.value })} 
                        min={1} 
                        showButtons 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">주문 구분</label>
                    <InputText 
                        value={createOrderForm.orderType} 
                        onChange={(e) => setCreateOrderForm({ ...createOrderForm, orderType: e.target.value })} 
                        placeholder="B2C, B2B" 
                    />
                </div>
                
                <div className="field col-12 md:col-4">
                    <label className="font-bold">고객명</label>
                    <InputText 
                        value={createOrderForm.customerName} 
                        onChange={(e) => setCreateOrderForm({ ...createOrderForm, customerName: e.target.value })} 
                        placeholder="고객 이름" 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">연락처</label>
                    <InputText 
                        value={createOrderForm.customerPhone} 
                        onChange={(e) => setCreateOrderForm({ ...createOrderForm, customerPhone: e.target.value })} 
                        placeholder="010-0000-0000" 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">표면 처리</label>
                    <InputText 
                        value={createOrderForm.surfaceFinish} 
                        onChange={(e) => setCreateOrderForm({ ...createOrderForm, surfaceFinish: e.target.value })} 
                        placeholder="유광/무광 등" 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">각인 문구</label>
                    <InputText 
                        value={createOrderForm.engravingText} 
                        onChange={(e) => setCreateOrderForm({ ...createOrderForm, engravingText: e.target.value })} 
                        placeholder="각인 텍스트" 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">각인 위치</label>
                    <InputText 
                        value={createOrderForm.engravingLocation} 
                        onChange={(e) => setCreateOrderForm({ ...createOrderForm, engravingLocation: e.target.value })} 
                        placeholder="반지 안쪽 등" 
                    />
                </div>

                <div className="field col-12">
                    <label className="font-bold">소비자가 (₩)</label>
                    <InputNumber 
                        value={createOrderForm.finalConsumerPrice} 
                        onValueChange={(e) => setCreateOrderForm({ ...createOrderForm, finalConsumerPrice: e.value || 0 })} 
                        mode="currency" 
                        currency="KRW" 
                        locale="ko-KR" 
                    />
                </div>
            </div>
            
            <div className="flex justify-content-end mt-4 pt-3 border-top-1 surface-border">
                <Button 
                    label="취소" 
                    icon="pi pi-times" 
                    onClick={onHide} 
                    className="p-button-text p-button-secondary mr-2" 
                    style={{ width: 'auto' }} 
                />
                <Button 
                    label="주문 등록" 
                    icon="pi pi-check" 
                    onClick={submitCreateOrder} 
                    className="p-button-primary" 
                    style={{ width: 'auto' }} 
                    autoFocus 
                />
            </div>
        </Dialog>
    );
};
