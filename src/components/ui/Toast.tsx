import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import './Toast.css';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    title: string;
    description?: string;
    type?: ToastType;
}

interface ToastContextType {
    toast: (message: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const toast = useCallback((message: Omit<ToastMessage, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { ...message, id, type: message.type || 'default' }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="toast-viewport">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type} animate-in`}>
                        <div className="toast-icon">
                            {t.type === 'success' && <CheckCircle size={20} />}
                            {t.type === 'error' && <AlertCircle size={20} />}
                            {t.type === 'warning' && <AlertTriangle size={20} />}
                            {t.type === 'info' && <Info size={20} />}
                        </div>
                        <div className="toast-content">
                            <h4 className="toast-title">{t.title}</h4>
                            {t.description && <p className="toast-description">{t.description}</p>}
                        </div>
                        <button className="toast-close" onClick={() => removeToast(t.id)}>
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
