import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastType, ConfirmDialogOptions } from '../types';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (type: ToastType, title: string, message: string, durationMs?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  removeToast: (id: string) => void;
  // Modal de confirmación propio
  confirmState: ConfirmDialogOptions | null;
  confirm: (options: ConfirmDialogOptions) => void;
  closeConfirm: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmDialogOptions | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message: string = '', durationMs: number = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastMessage = { id, type, title, message, durationMs };
    setToasts((prev) => [...prev, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message: string = '') => {
    showToast('success', title, message);
  }, [showToast]);

  const error = useCallback((title: string, message: string = '') => {
    showToast('error', title, message, 5000);
  }, [showToast]);

  const warning = useCallback((title: string, message: string = '') => {
    showToast('warning', title, message, 4500);
  }, [showToast]);

  const info = useCallback((title: string, message: string = '') => {
    showToast('info', title, message);
  }, [showToast]);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    setConfirmState(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(null);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        removeToast,
        confirmState,
        confirm,
        closeConfirm,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
};
