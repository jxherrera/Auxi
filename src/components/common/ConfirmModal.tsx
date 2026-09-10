import React from 'react';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { confirmState, closeConfirm } = useToast();

  if (!confirmState) return null;

  const {
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger',
    onConfirm,
    onCancel,
  } = confirmState;

  const handleConfirm = () => {
    onConfirm();
    closeConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeConfirm();
  };

  const typeConfig = {
    danger: {
      icon: AlertCircle,
      iconBg: 'bg-rose-100 text-rose-700',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 text-amber-700',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: HelpCircle,
      iconBg: 'bg-blue-100 text-blue-700',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 text-emerald-700',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={handleCancel}
    >
      <div
        className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-5 sm:p-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${typeConfig.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-slate-900 leading-tight">
              {title}
            </h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition shadow-xs cursor-pointer ${typeConfig.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
