import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const config = {
          success: {
            bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
            icon: CheckCircle2,
            iconColor: 'text-emerald-600',
            accent: 'bg-emerald-500',
          },
          error: {
            bg: 'bg-rose-50 border-rose-300 text-rose-950',
            icon: XCircle,
            iconColor: 'text-rose-600',
            accent: 'bg-rose-500',
          },
          warning: {
            bg: 'bg-amber-50 border-amber-300 text-amber-950',
            icon: AlertTriangle,
            iconColor: 'text-amber-600',
            accent: 'bg-amber-500',
          },
          info: {
            bg: 'bg-blue-50 border-blue-300 text-blue-950',
            icon: Info,
            iconColor: 'text-blue-600',
            accent: 'bg-blue-500',
          },
        }[toast.type];

        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-xs transition-all duration-200 animate-in slide-in-from-bottom-5 ${config.bg}`}
          >
            <div className="p-1 rounded-lg shrink-0 mt-0.5">
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h5 className="font-bold text-xs leading-snug">{toast.title}</h5>
              {toast.message && (
                <p className="text-[11px] opacity-90 mt-0.5 leading-normal break-words">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
