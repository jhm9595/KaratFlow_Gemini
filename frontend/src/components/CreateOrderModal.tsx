import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { AutoComplete } from 'primereact/autocomplete';
import { Dropdown } from 'primereact/dropdown';
import { formatImageUrl } from '../utils/image';

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
    templates?: any[];
    localImagePreview?: string | null;
    onOpenProcessManager?: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
    visible, onHide, createOrderForm, setCreateOrderForm, selectedProduct, setSelectedProduct,
    filteredProducts, searchProduct, handleFileUpload, submitCreateOrder, templates, localImagePreview,
    onOpenProcessManager
}) => {
    const hasTemplates = templates && templates.length > 0;

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
            {!hasTemplates && (
                <div className="surface-0 p-3 border-round-xl border-1 border-amber-200 bg-amber-50 flex flex-wrap align-items-center justify-content-between gap-3 mb-4 shadow-1">
                    <div className="flex align-items-center gap-2.5">
                        <i className="pi pi-exclamation-circle text-amber-600 text-lg font-bold"></i>
                        <span className="font-bold text-amber-900 text-sm">공정 템플릿 등록이 필요합니다.</span>
                    </div>
                    {onOpenProcessManager && (
                        <Button 
                            label="+ 템플릿 등록" 
                            icon="pi pi-plus" 
                            className="p-button-warning p-button-sm font-bold flex-shrink-0" 
                            style={{ width: 'auto' }}
                            onClick={() => {
                                onHide();
                                onOpenProcessManager();
                            }} 
                        />
                    )}
                </div>
            )}

            <div className="formgrid grid mt-2">
                {(!selectedProduct || typeof selectedProduct === 'string') && (
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">브랜드 (옵션)</label>
                        <InputText 
                            value={createOrderForm.unmappedBrandName || ''} 
                            onChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, unmappedBrandName: e.target.value }))} 
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
                                setCreateOrderForm((prev: any) => ({ 
                                    ...prev, 
                                    designId: e.value.id, 
                                    unmappedProductName: '', 
                                    unmappedBrandName: '',
                                    imageUrl: prev.imageUrl || ''
                                }));
                            } else if (typeof e.value === 'string') {
                                setCreateOrderForm((prev: any) => ({ 
                                    ...prev, 
                                    designId: 0, 
                                    unmappedProductName: e.value 
                                }));
                            }
                        }} 
                        itemTemplate={(item: any) => (
                            <div className="flex align-items-center gap-2">
                                {item.imageUrl && (
                                    <img 
                                        src={formatImageUrl(item.imageUrl)} 
                                        alt={item.name} 
                                        style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} 
                                        onError={(e: any) => { e.target.style.display = 'none'; }}
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
                    <label className="font-bold">제품 이미지 (선택, 최대 10MB)</label>
                    <div className="flex align-items-center gap-2">
                        <input 
                            type="file" 
                            onChange={handleFileUpload} 
                            accept="image/*" 
                            className="p-inputtext p-component flex-1" 
                            style={{ padding: '0.5rem' }} 
                        />
                        {(localImagePreview || createOrderForm.imageUrl) && (
                            <img 
                                src={localImagePreview || formatImageUrl(createOrderForm.imageUrl)} 
                                alt="preview" 
                                className="shadow-2 border-round" 
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                                onError={(e: any) => { e.target.style.display = 'none'; }}
                            />
                        )}
                    </div>
                    <small className="text-500 mt-1 block">
                        * 최대 10MB 이하 이미지 첨부 가능 (브라우저 자동 최적화 및 로컬 미리보기가 적용됩니다).
                    </small>
                </div>

                <div className="field col-12 md:col-6">
                    <label className="font-bold">수량</label>
                    <InputNumber 
                        value={createOrderForm.quantity} 
                        onValueChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, quantity: (e.value === null || e.value === undefined) ? 1 : e.value }))} 
                        min={1} 
                        showButtons 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">주문 구분</label>
                    <InputText 
                        value={createOrderForm.orderType || ''} 
                        onChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, orderType: e.target.value }))} 
                        placeholder="B2C, B2B" 
                    />
                </div>

                {hasTemplates ? (
                    <div className="field col-12 md:col-8">
                        <label className="font-bold text-primary flex align-items-center gap-1">
                            <i className="pi pi-sitemap"></i> 적용 공정 템플릿 선택 <span className="text-red-500">*</span>
                        </label>
                        <Dropdown 
                            value={createOrderForm.processTemplateId || (templates.find(t => t.isDefault)?.id || templates[0].id)} 
                            options={templates.filter(t => t && t.templateName && t.templateName.trim() !== '').map(t => ({
                                label: `${t.templateName}${t.isDefault ? ' (기본)' : ''} [${t.steps?.map((s: any) => s.stageName).join(' ➔ ')}]`,
                                value: t.id
                            }))} 
                            onChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, processTemplateId: e.value }))} 
                            placeholder="공정 템플릿 선택" 
                        />
                    </div>
                ) : (
                    <div className="field col-12 md:col-8">
                        <label className="font-bold text-500 flex align-items-center gap-1">
                            <i className="pi pi-sitemap"></i> 적용 공정 템플릿
                        </label>
                        <InputText value="등록된 공정 템플릿이 없습니다" disabled className="text-500 surface-100" />
                    </div>
                )}
                
                <div className="field col-12 md:col-4">
                    <label className="font-bold">고객명</label>
                    <InputText 
                        value={createOrderForm.customerName || ''} 
                        onChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, customerName: e.target.value }))} 
                        placeholder="고객 이름" 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">연락처</label>
                    <InputText 
                        value={createOrderForm.customerPhone || ''} 
                        onChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, customerPhone: e.target.value }))} 
                        placeholder="010-0000-0000" 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">표면 처리</label>
                    <InputText 
                        value={createOrderForm.surfaceFinish || ''} 
                        onChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, surfaceFinish: e.target.value }))} 
                        placeholder="유광/무광 등" 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">각인 문구</label>
                    <InputText 
                        value={createOrderForm.engravingText || ''} 
                        onChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, engravingText: e.target.value }))} 
                        placeholder="각인 텍스트" 
                    />
                </div>

                <div className="field col-12 md:col-4">
                    <label className="font-bold">각인 위치</label>
                    <InputText 
                        value={createOrderForm.engravingLocation || ''} 
                        onChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, engravingLocation: e.target.value }))} 
                        placeholder="반지 안쪽 등" 
                    />
                </div>

                <div className="field col-12">
                    <label className="font-bold">소비자가 (₩)</label>
                    <InputNumber 
                        value={createOrderForm.finalConsumerPrice} 
                        onValueChange={(e) => setCreateOrderForm((prev: any) => ({ ...prev, finalConsumerPrice: e.value || 0 }))} 
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
                    label={hasTemplates ? "주문 등록" : "공정 템플릿 필요"} 
                    icon="pi pi-check" 
                    onClick={submitCreateOrder} 
                    disabled={!hasTemplates}
                    className="p-button-primary" 
                    style={{ width: 'auto' }} 
                    autoFocus={hasTemplates} 
                />
            </div>
        </Dialog>
    );
};
