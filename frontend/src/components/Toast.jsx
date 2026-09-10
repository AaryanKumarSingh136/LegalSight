import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type} animate-slide-in`}>
            <div className="toast-icon">
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <XCircle size={16} />}
              {toast.type === 'warning' && <AlertTriangle size={16} />}
              {toast.type === 'info' && <Info size={16} />}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button 
              className="toast-close-btn" 
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { addToast: (msg) => console.log('Toast:', msg) };
  }
  return context;
}
