import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Zap } from 'lucide-react';

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
        }, 6000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
                {toasts.map((t) => (
                    <div 
                        key={t.id} 
                        className={`
                            pointer-events-auto flex items-center gap-6 p-6 rounded-[2rem] 
                            backdrop-blur-3xl border border-white/20 shadow-3xl animate-denver-in
                            ${t.type === 'success' ? 'bg-emerald-500/90 text-white' : 
                              t.type === 'error' ? 'bg-rose-500/90 text-white' : 
                              t.type === 'warning' ? 'bg-amber-500/90 text-white' : 
                              'bg-slate-900/95 text-white'}
                        `}
                    >
                        <div className={`
                            w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
                            bg-white/10 border border-white/10
                        `}>
                            {t.type === 'success' && <CheckCircle size={28} />}
                            {t.type === 'error' && <AlertCircle size={28} />}
                            {t.type === 'warning' && <AlertTriangle size={28} />}
                            {t.type === 'info' || t.type === 'default' ? <Zap size={28} className="text-primary" /> : null}
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none">{t.title}</h4>
                            {t.description && <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-tight">{t.description}</p>}
                        </div>
                        <button 
                            className="w-10 h-10 hover:bg-black/10 rounded-xl flex items-center justify-center transition-colors shrink-0" 
                            onClick={() => removeToast(t.id)}
                        >
                            <X size={18} />
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
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
