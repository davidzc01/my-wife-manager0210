import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ModalContextType {
  showSexModal: boolean;
  setShowSexModal: (show: boolean) => void;
  showWishModal: boolean;
  setShowWishModal: (show: boolean) => void;
  showAddObservationModal: boolean;
  setShowAddObservationModal: (show: boolean) => void;
  observationUpdated: boolean;
  setObservationUpdated: (updated: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [showSexModal, setShowSexModal] = useState(false);
  const [showWishModal, setShowWishModal] = useState(false);
  const [showAddObservationModal, setShowAddObservationModal] = useState(false);
  const [observationUpdated, setObservationUpdated] = useState(false);

  return (
    <ModalContext.Provider value={{ 
      showSexModal, 
      setShowSexModal, 
      showWishModal, 
      setShowWishModal,
      showAddObservationModal,
      setShowAddObservationModal,
      observationUpdated,
      setObservationUpdated
    }}>
      {children}
    </ModalContext.Provider>
  );
};
