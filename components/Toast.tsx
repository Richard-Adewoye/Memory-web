'use client';

import React from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center justify-between gap-3 bg-slate-900/95 text-slate-100 border border-slate-700 shadow-2xl rounded-xl px-4 py-3 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span className="text-sm font-medium">{t.message}</span>
          <div className="flex items-center gap-2 shrink-0">
            {t.actionText && t.onAction && (
              <button
                onClick={() => {
                  t.onAction?.();
                  onDismiss(t.id);
                }}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 px-2 py-1 rounded hover:bg-slate-800 transition"
              >
                {t.actionText}
              </button>
            )}
            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-slate-200 p-1 text-xs"
              aria-label="Close toast"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
