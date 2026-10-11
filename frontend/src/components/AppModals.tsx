import React from 'react';
import { CreateOrderModal } from './CreateOrderModal';
import { ChangeRequestModal } from './ChangeRequestModal';
import { CancelOrderModal } from './CancelOrderModal';
import { PartnerHandshakeModal } from './PartnerHandshakeModal';
import { SubcontractModal } from './SubcontractModal';
import { OrderDetailModal } from './OrderDetailModal';
import { MultiOrderDetailModal } from './MultiOrderDetailModal';
import { ProcessManager } from '../ProcessManager';
import { GoldToolsModal } from '../GoldToolsModal';
import { PipelineStatusBadge } from './pipeline/PipelineStatusBadge';

interface AppModalsProps {
    createOrderModalVisible: boolean;
    setCreateOrderModalVisible: (v: boolean) => void;
    createOrderForm: any;
    setCreateOrderForm: (f: any) => void;
    selectedProduct: any;
    setSelectedProduct: (p: any) => void;
    filteredProducts: any[];
    searchProduct: (e: any) => void;
    handleFileUpload: (e: any) => void;
    submitCreateOrder: () => void;
    localImagePreview?: string | null;

    changeModalVisible: boolean;
    setChangeModalVisible: (v: boolean) => void;
    submitChangeRequest: () => void;

    cancelModalVisible: boolean;
    setCancelModalVisible: (v: boolean) => void;
    cancelEstimate: number | null;
    submitCancelOrder: () => void;

    partnerModalVisible: boolean;
    setPartnerModalVisible: (v: boolean) => void;
    handshakes: any[];
    handshakePin: string;
    setHandshakePin: (p: string) => void;
    generatedPin: string | null;
    requestHandshake: () => void;
    verifyHandshake: () => void;
    businessNumber: string;
    setBusinessNumber: (b: string) => void;
    verifyBusiness: () => void;
    businessResult: any;

    subcontractModalVisible: boolean;
    setSubcontractModalVisible: (v: boolean) => void;
    subcontracts: any[];
    scForm: any;
    setScForm: (f: any) => void;
    receiveForm: any;
    setReceiveForm: (f: any) => void;
    handleDispatchSubcontract: () => void;
    handleReceiveSubcontract: (id: number) => void;

    selectedOrderId: number | null;
    orders: any[];
    orderDetailVisible: boolean;
    setOrderDetailVisible: (v: boolean) => void;
    orderDetailData: any;
    pipelineStages: string[];
    pipelineSteps: any[];
    advanceStage: (id: number) => void;
    openSubcontractModal: (id: number) => void;
    openCancelModal: (id: number) => void;
    handlePrint: (order: any, mode: 'label' | 'invoice') => void;

    processManagerVisible: boolean;
    setProcessManagerVisible: (v: boolean) => void;
    fetchOrders: () => void;
    fetchPipelineStages: () => void;

    goldToolsVisible: boolean;
    setGoldToolsVisible: (v: boolean) => void;
    goldPriceData: any[];
    templates?: any[];
}

export const AppModals: React.FC<AppModalsProps> = ({
    createOrderModalVisible,
    setCreateOrderModalVisible,
    createOrderForm,
    setCreateOrderForm,
    selectedProduct,
    setSelectedProduct,
    filteredProducts,
    searchProduct,
    handleFileUpload,
    submitCreateOrder,
    localImagePreview,

    changeModalVisible,
    setChangeModalVisible,
    submitChangeRequest,

    cancelModalVisible,
    setCancelModalVisible,
    cancelEstimate,
    submitCancelOrder,

    partnerModalVisible,
    setPartnerModalVisible,
    handshakes,
    handshakePin,
    setHandshakePin,
    generatedPin,
    requestHandshake,
    verifyHandshake,
    businessNumber,
    setBusinessNumber,
    verifyBusiness,
    businessResult,

    subcontractModalVisible,
    setSubcontractModalVisible,
    subcontracts,
    scForm,
    setScForm,
    receiveForm,
    setReceiveForm,
    handleDispatchSubcontract,
    handleReceiveSubcontract,

    selectedOrderId,
    orders,
    orderDetailVisible,
    setOrderDetailVisible,
    orderDetailData,
    pipelineStages,
    pipelineSteps,
    advanceStage,
    openSubcontractModal,
    openCancelModal,
    handlePrint,

    processManagerVisible,
    setProcessManagerVisible,
    fetchOrders,
    fetchPipelineStages,

    goldToolsVisible,
    setGoldToolsVisible,
    goldPriceData,
    templates,
}) => {
    const currentOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;
    const isMultiItem = Boolean(
        (currentOrder?.quantity && currentOrder.quantity > 1) || 
        (orderDetailData?.workOrders && orderDetailData.workOrders.length > 1)
    );

    const renderStatusBadge = (rowData: any) => (
        <PipelineStatusBadge rowData={rowData} pipelineSteps={pipelineSteps} pipelineStages={pipelineStages} />
    );

    return (
        <>
            <CreateOrderModal
                visible={createOrderModalVisible}
                onHide={() => setCreateOrderModalVisible(false)}
                createOrderForm={createOrderForm}
                setCreateOrderForm={setCreateOrderForm}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                filteredProducts={filteredProducts}
                searchProduct={searchProduct}
                handleFileUpload={handleFileUpload}
                submitCreateOrder={submitCreateOrder}
                templates={templates}
                localImagePreview={localImagePreview}
                onOpenProcessManager={() => setProcessManagerVisible(true)}
            />

            <ChangeRequestModal
                visible={changeModalVisible}
                onHide={() => setChangeModalVisible(false)}
                submitChangeRequest={submitChangeRequest}
            />

            <CancelOrderModal
                visible={cancelModalVisible}
                onHide={() => setCancelModalVisible(false)}
                cancelEstimate={cancelEstimate}
                submitCancelOrder={submitCancelOrder}
            />

            <PartnerHandshakeModal
                visible={partnerModalVisible}
                onHide={() => setPartnerModalVisible(false)}
                handshakes={handshakes}
                handshakePin={handshakePin}
                setHandshakePin={setHandshakePin}
                generatedPin={generatedPin}
                requestHandshake={requestHandshake}
                verifyHandshake={verifyHandshake}
                businessNumber={businessNumber}
                setBusinessNumber={setBusinessNumber}
                verifyBusiness={verifyBusiness}
                businessResult={businessResult}
            />

            <SubcontractModal
                visible={subcontractModalVisible}
                onHide={() => setSubcontractModalVisible(false)}
                subcontracts={subcontracts}
                scForm={scForm}
                setScForm={setScForm}
                receiveForm={receiveForm}
                setReceiveForm={setReceiveForm}
                handleDispatchSubcontract={handleDispatchSubcontract}
                handleReceiveSubcontract={handleReceiveSubcontract}
            />

            {selectedOrderId && currentOrder && (
                isMultiItem ? (
                    <MultiOrderDetailModal
                        visible={orderDetailVisible}
                        onHide={() => setOrderDetailVisible(false)}
                        order={currentOrder}
                        orderDetailData={orderDetailData}
                        pipelineStages={pipelineStages}
                        pipelineSteps={pipelineSteps}
                        advanceStage={advanceStage}
                        openSubcontractModal={(id) => { setOrderDetailVisible(false); openSubcontractModal(id); }}
                        openChangeModal={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }}
                        openCancelModal={(id) => { setOrderDetailVisible(false); openCancelModal(id); }}
                        handlePrint={handlePrint}
                        statusBodyTemplate={renderStatusBadge}
                    />
                ) : (
                    <OrderDetailModal
                        visible={orderDetailVisible}
                        onHide={() => setOrderDetailVisible(false)}
                        order={currentOrder}
                        orderDetailData={orderDetailData}
                        pipelineStages={pipelineStages}
                        pipelineSteps={pipelineSteps}
                        advanceStage={advanceStage}
                        openSubcontractModal={(id) => { setOrderDetailVisible(false); openSubcontractModal(id); }}
                        openChangeModal={() => { setOrderDetailVisible(false); setChangeModalVisible(true); }}
                        openCancelModal={(id) => { setOrderDetailVisible(false); openCancelModal(id); }}
                        handlePrint={handlePrint}
                        statusBodyTemplate={renderStatusBadge}
                    />
                )
            )}

            <ProcessManager 
                visible={processManagerVisible} 
                onHide={() => {
                    setProcessManagerVisible(false);
                    fetchOrders();
                    fetchPipelineStages();
                }} 
            />

            <GoldToolsModal 
                visible={goldToolsVisible} 
                onHide={() => setGoldToolsVisible(false)} 
                recentPrices={goldPriceData} 
            />
        </>
    );
};

export default AppModals;
