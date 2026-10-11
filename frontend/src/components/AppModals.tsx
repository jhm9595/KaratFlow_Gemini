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
import { useModal } from '../hooks/useModal';

export interface AppModalsProps {
    // Create Order Modal props
    createOrderForm: any;
    setCreateOrderForm: (f: any) => void;
    selectedProduct: any;
    setSelectedProduct: (p: any) => void;
    filteredProducts: any[];
    searchProduct: (e: any) => void;
    handleFileUpload: (e: any) => void;
    submitCreateOrder: () => void;
    localImagePreview?: string | null;

    // Change Request Modal props
    submitChangeRequest: () => void;

    // Cancel Order Modal props
    cancelEstimate: number | null;
    submitCancelOrder: () => void;

    // Partner Handshake Modal props
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

    // Subcontract Modal props
    subcontracts: any[];
    scForm: any;
    setScForm: (f: any) => void;
    receiveForm: any;
    setReceiveForm: (f: any) => void;
    handleDispatchSubcontract: () => void;
    handleReceiveSubcontract: (id: number) => void;

    // Order Detail Modal props
    selectedOrderId: number | null;
    orders: any[];
    orderDetailData: any;
    pipelineStages: string[];
    pipelineSteps: any[];
    advanceStage: (id: number) => void;
    advanceWorkOrderStage?: (workOrderId: number) => void;
    openSubcontractModal: (id: number) => void;
    openCancelModal: (id: number) => void;
    handlePrint: (order: any, mode: 'label' | 'invoice') => void;

    // Process Manager callbacks
    fetchOrders: () => void;
    fetchPipelineStages: () => void;

    // Gold Tools props
    goldPriceData: any[];
    templates?: any[];
}

export const AppModals: React.FC<AppModalsProps> = ({
    createOrderForm,
    setCreateOrderForm,
    selectedProduct,
    setSelectedProduct,
    filteredProducts,
    searchProduct,
    handleFileUpload,
    submitCreateOrder,
    localImagePreview,

    submitChangeRequest,

    cancelEstimate,
    submitCancelOrder,

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

    subcontracts,
    scForm,
    setScForm,
    receiveForm,
    setReceiveForm,
    handleDispatchSubcontract,
    handleReceiveSubcontract,

    selectedOrderId,
    orders,
    orderDetailData,
    pipelineStages,
    pipelineSteps,
    advanceStage,
    advanceWorkOrderStage,
    openSubcontractModal,
    openCancelModal,
    handlePrint,

    fetchOrders,
    fetchPipelineStages,

    goldPriceData,
    templates,
}) => {
    const { isOpen, openModal, closeModal } = useModal();

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
                visible={isOpen('createOrder')}
                onHide={() => closeModal('createOrder')}
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
                onOpenProcessManager={() => openModal('processManager')}
            />

            <ChangeRequestModal
                visible={isOpen('changeRequest')}
                onHide={() => closeModal('changeRequest')}
                submitChangeRequest={submitChangeRequest}
            />

            <CancelOrderModal
                visible={isOpen('cancelOrder')}
                onHide={() => closeModal('cancelOrder')}
                cancelEstimate={cancelEstimate}
                submitCancelOrder={submitCancelOrder}
            />

            <PartnerHandshakeModal
                visible={isOpen('partnerHandshake')}
                onHide={() => closeModal('partnerHandshake')}
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
                visible={isOpen('subcontract')}
                onHide={() => closeModal('subcontract')}
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
                        visible={isOpen('orderDetail')}
                        onHide={() => closeModal('orderDetail')}
                        order={currentOrder}
                        orderDetailData={orderDetailData}
                        pipelineStages={pipelineStages}
                        pipelineSteps={pipelineSteps}
                        advanceStage={advanceStage}
                        advanceWorkOrderStage={advanceWorkOrderStage}
                        openSubcontractModal={(id) => { closeModal('orderDetail'); openSubcontractModal(id); }}
                        openChangeModal={() => { closeModal('orderDetail'); openModal('changeRequest'); }}
                        openCancelModal={(id) => { closeModal('orderDetail'); openCancelModal(id); }}
                        handlePrint={handlePrint}
                        statusBodyTemplate={renderStatusBadge}
                    />
                ) : (
                    <OrderDetailModal
                        visible={isOpen('orderDetail')}
                        onHide={() => closeModal('orderDetail')}
                        order={currentOrder}
                        orderDetailData={orderDetailData}
                        pipelineStages={pipelineStages}
                        pipelineSteps={pipelineSteps}
                        advanceStage={advanceStage}
                        openSubcontractModal={(id) => { closeModal('orderDetail'); openSubcontractModal(id); }}
                        openChangeModal={() => { closeModal('orderDetail'); openModal('changeRequest'); }}
                        openCancelModal={(id) => { closeModal('orderDetail'); openCancelModal(id); }}
                        handlePrint={handlePrint}
                        statusBodyTemplate={renderStatusBadge}
                    />
                )
            )}

            <ProcessManager 
                visible={isOpen('processManager')} 
                onHide={() => {
                    closeModal('processManager');
                    fetchOrders();
                    fetchPipelineStages();
                }} 
            />

            <GoldToolsModal 
                visible={isOpen('goldTools')} 
                onHide={() => closeModal('goldTools')} 
                recentPrices={goldPriceData} 
            />
        </>
    );
};

export default AppModals;
