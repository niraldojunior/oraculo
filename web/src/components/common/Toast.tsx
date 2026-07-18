import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type = 'info', duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const typeClass: Record<ToastType, string> = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info',
  };

  return (
    <div className={`toast ${typeClass[type]}`} role="alert">
      <div className="toast-content">{message}</div>
      <button className="toast-close" onClick={() => onClose(id)} aria-label="Fechar notificação">
        ✕
      </button>
    </div>
  );
};

export default Toast;
