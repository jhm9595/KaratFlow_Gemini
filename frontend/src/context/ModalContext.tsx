import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

export type ModalType = 
    | 'createOrder'
    | 'changeRequest'
    | 'cancelOrder'
    | 'partnerHandshake'
    | 'subcontract'
    | 'orderDetail'
    | 'processManager'
    | 'goldTools';

export interface ModalEntry<T = any> {
    isOpen: boolean;
    data?: T;
}

export interface ModalContextValue {
    isOpen: (type: ModalType) => boolean;
    openModal: <T = any>(type: ModalType, data?: T) => void;
    closeModal: (type?: ModalType) => void;
    toggleModal: <T = any>(type: ModalType, data?: T) => void;
    getModalData: <T = any>(type: ModalType) => T | undefined;
    activeModals: Partial<Record<ModalType, ModalEntry>>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
    const [modals, setModals] = useState<Partial<Record<ModalType, ModalEntry>>>({});

    const isOpen = useCallback((type: ModalType): boolean => {
        return Boolean(modals[type]?.isOpen);
    }, [modals]);

    const getModalData = useCallback(<T = any>(type: ModalType): T | undefined => {
        return modals[type]?.data as T | undefined;
    }, [modals]);

    const openModal = useCallback(<T = any>(type: ModalType, data?: T) => {
        setModals(prev => ({
            ...prev,
            [type]: { isOpen: true, data }
        }));
    }, []);

    const closeModal = useCallback((type?: ModalType) => {
        if (!type) {
            // Close all open modals
            setModals({});
            return;
        }
        setModals(prev => {
            if (!prev[type]?.isOpen) return prev;
            return {
                ...prev,
                [type]: { isOpen: false, data: undefined }
            };
        });
    }, []);

    const toggleModal = useCallback(<T = any>(type: ModalType, data?: T) => {
        setModals(prev => {
            const currentIsOpen = Boolean(prev[type]?.isOpen);
            return {
                ...prev,
                [type]: { isOpen: !currentIsOpen, data: !currentIsOpen ? data : undefined }
            };
        });
    }, []);

    const value = useMemo<ModalContextValue>(() => ({
        isOpen,
        openModal,
        closeModal,
        toggleModal,
        getModalData,
        activeModals: modals
    }), [isOpen, openModal, closeModal, toggleModal, getModalData, modals]);

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

export function useModal(): ModalContextValue;
export function useModal<T = any>(type: ModalType): {
    isOpen: boolean;
    open: (data?: T) => void;
    close: () => void;
    toggle: (data?: T) => void;
    data: T | undefined;
};
export function useModal<T = any>(type?: ModalType) {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }

    if (!type) {
        return context;
    }

    return {
        isOpen: context.isOpen(type),
        open: (data?: T) => context.openModal<T>(type, data),
        close: () => context.closeModal(type),
        toggle: (data?: T) => context.toggleModal<T>(type, data),
        data: context.getModalData<T>(type)
    };
}
