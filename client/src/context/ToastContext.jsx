import React, { createContext, useState, useContext, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Container to display toast items */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl border shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-2 sm:slide-in-from-right-4 fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/50 backdrop-blur-md'
                : toast.type === 'error'
                ? 'bg-rose-50/90 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-900/50 backdrop-blur-md'
                : 'glass text-foreground'
            }`}
          >
            <div className="flex items-center space-x-3">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-primary shrink-0" />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
