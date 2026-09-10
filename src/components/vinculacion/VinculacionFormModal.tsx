import React from 'react';
import { JornadaFormModal } from './JornadaFormModal';
import { Jornada } from '../../types';

interface VinculacionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vinculacionToEdit?: Jornada | null;
}

/**
 * VinculacionFormModal
 * Wrapper de compatibilidad hacia JornadaFormModal (soporte multi-trabajador, horas netas con almuerzo y tarifa $0 familiar)
 */
export const VinculacionFormModal: React.FC<VinculacionFormModalProps> = ({
  isOpen,
  onClose,
  vinculacionToEdit,
}) => {
  return (
    <JornadaFormModal
      isOpen={isOpen}
      onClose={onClose}
      jornadaToEdit={vinculacionToEdit}
    />
  );
};

export default VinculacionFormModal;
