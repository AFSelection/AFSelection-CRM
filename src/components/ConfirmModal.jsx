import React from 'react';
import { AlertTriangle, Trash2, X, Info, CheckCircle2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirmar Acción',
  message = '¿Estás seguro de realizar esta acción?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'info' | 'success' | 'notice'
  onConfirm,
  onCancel,
  loading = false,
  isNotice = false // If true, only shows an OK button (like custom alert)
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-all duration-200">
      <div
        className="bg-white border border-border-light rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-5 right-5 text-primary/40 hover:text-primary p-2 rounded-full hover:bg-bg-canvas transition-colors cursor-pointer outline-none"
        >
          <X size={18} />
        </button>

        {/* Icon & Title Block */}
        <div className="flex items-start gap-4 pr-6">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              variant === 'danger'
                ? 'bg-red-50 text-red-500 border border-red-100'
                : variant === 'success'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-primary/5 text-primary border border-primary/10'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 size={22} />
            ) : variant === 'success' ? (
              <CheckCircle2 size={22} />
            ) : (
              <Info size={22} />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-primary tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-primary/60 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isNotice && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-5 py-3 rounded-xl text-xs font-bold text-primary/70 bg-bg-canvas hover:bg-border-light/60 transition-colors cursor-pointer outline-none"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm || onCancel}
            disabled={loading}
            className={`px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer outline-none ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : variant === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-primary hover:bg-primary-hover shadow-primary/20'
            }`}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
